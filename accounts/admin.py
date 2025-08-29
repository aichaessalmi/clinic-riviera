from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
from .forms import CustomUserCreationForm, CustomUserChangeForm

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User

    fieldsets = (
        (None, {"fields": ("username", "email", "password")}),
        ("Rôle & Code", {"fields": ("role", "code_personnel")}),
        ("Permissions", {"fields": ("is_staff", "is_active", "is_superuser", "groups", "user_permissions")}),
        ("Dates importantes", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "password1", "password2", "role", "code_personnel", "is_staff", "is_active"),
        }),
    )

    list_display = ("username", "email", "role", "code_personnel", "is_staff", "is_active")

    class Media:
        js = ("admin/js/hide_code_personnel.js",)  # JS pour masquer côté interface
