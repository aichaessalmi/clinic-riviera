# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Specialty
from .forms import CustomUserCreationForm, CustomUserChangeForm


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User

    fieldsets = (
        (None, {"fields": ("username", "email", "password")}),
        ("Identité", {"fields": ("first_name", "last_name")}),
        ("Rôle & Code", {"fields": ("role", "code_personnel")}),
        ("Profil professionnel", {
            "fields": (
                "telephone",
                "specialite",  # ✅ Nouveau champ lié à Specialty
                "departement",
                "licence_medicale",
                "date_adhesion",
                "poste",
                "photo",
            )
        }),
        ("Préférences", {"fields": ("langue", "theme", "notifications")}),
        ("Permissions", {
            "fields": (
                "is_staff", "is_active", "is_superuser",
                "groups", "user_permissions"
            )
        }),
        ("Dates importantes", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username", "email", "first_name", "last_name",
                "role", "code_personnel",
                "password1", "password2",
                "is_staff", "is_active",
            ),
        }),
    )

    list_display = ("username", "email", "role", "specialite", "departement", "is_active", "is_staff")
    search_fields = ("username", "email", "first_name", "last_name", "code_personnel")
    list_filter = ("role", "departement", "is_active", "is_staff")


@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ("name_fr", "name_en", "is_active")
    search_fields = ("name_fr", "name_en")
    list_filter = ("is_active",)
