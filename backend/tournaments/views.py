from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Tournament, TournamentRegistration
from .permissions import IsOrganizer
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegistrationReviewSerializer,
    SignupSerializer,
    TournamentRegistrationSerializer,
    TournamentSerializer,
    UserSerializer,
)


User = get_user_model()


@api_view(["GET"])
def api_root(request, format=None):
    return Response(
        {
            "signup": reverse("signup", request=request, format=format),
            "login": reverse("login", request=request, format=format),
            "refresh": reverse("token-refresh", request=request, format=format),
            "profile": reverse("profile", request=request, format=format),
            "tournaments": reverse("tournament-list-create", request=request, format=format),
            "my-tournaments": reverse("my-tournaments", request=request, format=format),
            "my-registrations": reverse("my-registrations", request=request, format=format),
        }
    )


class SignupView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class TournamentListCreateView(generics.ListCreateAPIView):
    queryset = Tournament.objects.select_related("organizer").prefetch_related("registrations")
    serializer_class = TournamentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsOrganizer()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)


class TournamentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Tournament.objects.select_related("organizer").prefetch_related("registrations")
    serializer_class = TournamentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOrganizer()]

    def perform_update(self, serializer):
        tournament = self.get_object()
        if tournament.organizer_id != self.request.user.id:
            raise permissions.PermissionDenied("Only the tournament organizer can edit this tournament.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.organizer_id != self.request.user.id:
            raise permissions.PermissionDenied("Only the tournament organizer can delete this tournament.")
        instance.delete()


class MyTournamentsView(generics.ListAPIView):
    serializer_class = TournamentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizer]

    def get_queryset(self):
        return Tournament.objects.filter(organizer=self.request.user).prefetch_related("registrations")


class TournamentRegistrationListCreateView(generics.ListCreateAPIView):
    serializer_class = TournamentRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tournament = generics.get_object_or_404(Tournament, pk=self.kwargs["tournament_id"])
        if tournament.organizer_id != self.request.user.id:
            raise permissions.PermissionDenied("Only the organizer can view registrations for this tournament.")
        return tournament.registrations.select_related("captain", "tournament")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        if request.user.role != User.ROLE_TEAM:
            raise permissions.PermissionDenied("Only team users can register for a tournament.")
        tournament = generics.get_object_or_404(Tournament, pk=self.kwargs["tournament_id"])
        serializer = self.get_serializer(
            data={**request.data, "tournament": tournament.id},
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(captain=request.user, tournament=tournament)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyRegistrationsView(generics.ListAPIView):
    serializer_class = TournamentRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TournamentRegistration.objects.filter(captain=self.request.user).select_related(
            "captain",
            "tournament",
        )


class RegistrationReviewView(generics.UpdateAPIView):
    queryset = TournamentRegistration.objects.select_related("tournament", "captain")
    serializer_class = RegistrationReviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizer]

    def update(self, request, *args, **kwargs):
        registration = self.get_object()
        if registration.tournament.organizer_id != request.user.id:
            raise permissions.PermissionDenied("Only the organizer can review this registration.")

        serializer = self.get_serializer(registration, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if (
            serializer.validated_data["status"] == TournamentRegistration.STATUS_APPROVED
            and registration.status != TournamentRegistration.STATUS_APPROVED
            and registration.tournament.approved_registrations_count >= registration.tournament.number_of_teams
        ):
            return Response(
                {"detail": "Tournament has already reached the approved team limit."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save(reviewed_at=timezone.now())
        output = TournamentRegistrationSerializer(registration, context={"request": request})
        return Response(output.data, status=status.HTTP_200_OK)
