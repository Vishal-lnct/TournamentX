from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


class User(AbstractUser):
    ROLE_ORGANIZER = "organizer"
    ROLE_TEAM = "team"
    ROLE_CHOICES = [
        (ROLE_ORGANIZER, "Organizer"),
        (ROLE_TEAM, "Team Captain / Player"),
    ]

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_TEAM)
    phone_number = models.CharField(max_length=20, blank=True)
    team_name = models.CharField(max_length=120, blank=True)

    REQUIRED_FIELDS = ["email", "full_name", "role"]

    def __str__(self):
        return f"{self.username} ({self.role})"


class Tournament(models.Model):
    SPORT_CHOICES = [
        ("cricket", "Cricket"),
        ("football", "Football"),
        ("kabaddi", "Kabaddi"),
        ("volleyball", "Volleyball"),
        ("badminton", "Badminton"),
        ("basketball", "Basketball"),
        ("hockey", "Hockey"),
        ("custom", "Custom"),
    ]
    FORMAT_CHOICES = [
        ("T20", "T20"),
        ("ODI", "ODI"),
        ("TEST", "Test"),
        ("T10", "T10"),
        ("CUSTOM", "Custom"),
    ]

    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organized_tournaments",
    )
    name = models.CharField(max_length=180)
    sport = models.CharField(max_length=20, choices=SPORT_CHOICES, default="cricket")
    location = models.CharField(max_length=255)
    entry_fee = models.DecimalField(max_digits=10, decimal_places=2)
    prize_details = models.TextField()
    number_of_teams = models.PositiveIntegerField()
    match_format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default="T20")
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.TextField()
    banner = models.ImageField(upload_to="tournament_banners/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_date", "-created_at"]

    def clean(self):
        if self.end_date < self.start_date:
            raise ValidationError("End date must be after start date.")

    @property
    def approved_registrations_count(self):
        return self.registrations.filter(status=TournamentRegistration.STATUS_APPROVED).count()

    @property
    def slots_left(self):
        return max(self.number_of_teams - self.approved_registrations_count, 0)

    def __str__(self):
        return self.name


class TournamentRegistration(models.Model):
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name="registrations",
    )
    captain = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tournament_registrations",
    )
    team_name = models.CharField(max_length=120)
    team_city = models.CharField(max_length=120)
    player_count = models.PositiveIntegerField(default=11)
    contact_number = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["tournament", "captain"],
                name="unique_registration_per_captain_per_tournament",
            )
        ]

    def __str__(self):
        return f"{self.team_name} - {self.tournament.name}"
