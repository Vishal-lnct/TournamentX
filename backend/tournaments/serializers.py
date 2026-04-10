from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Tournament, TournamentRegistration


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "role",
            "phone_number",
            "team_name",
        ]
        read_only_fields = ["id"]


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "full_name",
            "role",
            "phone_number",
            "team_name",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if attrs.get("role") == User.ROLE_TEAM and not attrs.get("team_name"):
            raise serializers.ValidationError({"team_name": "Team name is required for team accounts."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class OrganizerSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "email"]


class TournamentSerializer(serializers.ModelSerializer):
    organizer = OrganizerSummarySerializer(read_only=True)
    approved_registrations_count = serializers.IntegerField(read_only=True)
    total_registrations_count = serializers.SerializerMethodField()
    slots_left = serializers.IntegerField(read_only=True)
    banner_url = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = [
            "id",
            "organizer",
            "name",
            "sport",
            "location",
            "entry_fee",
            "prize_details",
            "number_of_teams",
            "match_format",
            "start_date",
            "end_date",
            "description",
            "banner",
            "banner_url",
            "approved_registrations_count",
            "total_registrations_count",
            "slots_left",
            "is_registered",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organizer",
            "banner_url",
            "approved_registrations_count",
            "total_registrations_count",
            "slots_left",
            "is_registered",
            "created_at",
            "updated_at",
        ]

    def get_total_registrations_count(self, obj):
        return obj.registrations.count()

    def get_banner_url(self, obj):
        request = self.context.get("request")
        if not obj.banner:
            return ""
        url = obj.banner.url
        return request.build_absolute_uri(url) if request else url

    def get_is_registered(self, obj):
        request = self.context.get("request")
        if not request or request.user.is_anonymous:
            return False
        return obj.registrations.filter(captain=request.user).exists()


class TournamentRegistrationSerializer(serializers.ModelSerializer):
    captain = UserSerializer(read_only=True)
    tournament_name = serializers.CharField(source="tournament.name", read_only=True)
    tournament_sport = serializers.CharField(source="tournament.sport", read_only=True)

    class Meta:
        model = TournamentRegistration
        fields = [
            "id",
            "tournament",
            "tournament_name",
            "tournament_sport",
            "captain",
            "team_name",
            "team_city",
            "player_count",
            "contact_number",
            "notes",
            "status",
            "created_at",
            "reviewed_at",
        ]
        read_only_fields = ["id", "captain", "status", "created_at", "reviewed_at", "tournament_name", "tournament_sport"]

    def validate(self, attrs):
        tournament = attrs["tournament"]
        request = self.context["request"]
        if request.user.role != User.ROLE_TEAM:
            raise serializers.ValidationError("Only team users can register for tournaments.")
        if tournament.organizer_id == request.user.id:
            raise serializers.ValidationError("Organizers cannot register for their own tournament.")
        return attrs


class RegistrationReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = TournamentRegistration
        fields = ["status"]

    def validate_status(self, value):
        if value not in [TournamentRegistration.STATUS_APPROVED, TournamentRegistration.STATUS_REJECTED]:
            raise serializers.ValidationError("Status must be approved or rejected.")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
