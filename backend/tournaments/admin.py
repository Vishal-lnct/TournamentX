from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Tournament, TournamentRegistration, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Tournament Profile", {"fields": ("full_name", "role", "phone_number", "team_name")}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Tournament Profile", {"fields": ("email", "full_name", "role", "phone_number", "team_name")}),
    )
    list_display = ("username", "email", "role", "full_name", "is_staff")


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ("name", "sport", "location", "match_format", "start_date", "end_date", "organizer")
    search_fields = ("name", "sport", "location", "organizer__username", "organizer__full_name")
    list_filter = ("sport", "match_format", "start_date")


@admin.register(TournamentRegistration)
class TournamentRegistrationAdmin(admin.ModelAdmin):
    list_display = ("team_name", "tournament", "captain", "status", "created_at")
    search_fields = ("team_name", "tournament__name", "captain__username")
    list_filter = ("status", "created_at")
