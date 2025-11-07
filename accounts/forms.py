# accounts/forms.py
from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User

class CustomUserCreationForm(UserCreationForm):
    password1 = forms.CharField(label="Mot de passe", strip=False, required=False, widget=forms.PasswordInput)
    password2 = forms.CharField(label="Confirmation du mot de passe", strip=False, required=False, widget=forms.PasswordInput)

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username", "email", "first_name", "last_name", "role", "code_personnel")

    def clean(self):
        cleaned = super().clean()
        role = (cleaned.get("role") or "").lower()
        pwd1 = cleaned.get("password1")
        pwd2 = cleaned.get("password2")
        code_personnel = cleaned.get("code_personnel")

        if role == "medecin":
            if not code_personnel:
                self.add_error("code_personnel", "Le médecin doit avoir un code personnel.")
            cleaned["password1"] = None
            cleaned["password2"] = None
        elif role in {"secretaire", "direction"}:
            if not pwd1:
                self.add_error("password1", "Mot de passe requis pour ce rôle.")
            if pwd1 != pwd2:
                self.add_error("password2", "Les mots de passe ne correspondent pas.")
            cleaned["code_personnel"] = None
        else:
            self.add_error("role", "Rôle invalide.")

        return cleaned

class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = ("username", "email", "first_name", "last_name", "role", "code_personnel")
