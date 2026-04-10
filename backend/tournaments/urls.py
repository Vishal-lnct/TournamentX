from django.urls import path

from .views import (
    LoginView,
    LogoutView,
    MyRegistrationsView,
    MyTournamentsView,
    ProfileView,
    RefreshView,
    RegistrationReviewView,
    SignupView,
    TournamentDetailView,
    TournamentListCreateView,
    TournamentRegistrationListCreateView,
    api_root,
)


urlpatterns = [
    path("", api_root, name="api-root"),
    path("api/auth/signup/", SignupView.as_view(), name="signup"),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/logout/", LogoutView.as_view(), name="logout"),
    path("api/auth/refresh/", RefreshView.as_view(), name="token-refresh"),
    path("api/auth/profile/", ProfileView.as_view(), name="profile"),
    path("api/tournaments/", TournamentListCreateView.as_view(), name="tournament-list-create"),
    path("api/tournaments/mine/", MyTournamentsView.as_view(), name="my-tournaments"),
    path("api/tournaments/<int:pk>/", TournamentDetailView.as_view(), name="tournament-detail"),
    path(
        "api/tournaments/<int:tournament_id>/registrations/",
        TournamentRegistrationListCreateView.as_view(),
        name="tournament-registrations",
    ),
    path("api/registrations/mine/", MyRegistrationsView.as_view(), name="my-registrations"),
    path("api/registrations/<int:pk>/review/", RegistrationReviewView.as_view(), name="registration-review"),
]
