from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User

class CustomUserCreationForm(UserCreationForm):
    password1 = forms.CharField(
        label="Mot de passe",
        strip=False,
        required=False,   # <-- mot de passe facultatif
        widget=forms.PasswordInput,
    )
    password2 = forms.CharField(
        label="Confirmation du mot de passe",
        strip=False,
        required=False,   # <-- mot de passe facultatif
        widget=forms.PasswordInput,
    )

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username", "email", "role", "code_personnel")

    def clean(self):
        cleaned_data = super().clean()
        role = cleaned_data.get("role")
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")
        code_personnel = cleaned_data.get("code_personnel")

        if role == "medecin":
            if not code_personnel:
                self.add_error("code_personnel", "Le médecin doit avoir un code personnel.")
            # autoriser mot de passe vide
            cleaned_data["password1"] = None
            cleaned_data["password2"] = None
        else:
            # secrétaire / direction → mot de passe obligatoire
            if not password1:
                self.add_error("password1", "Mot de passe requis pour ce rôle.")
            if password1 != password2:
                self.add_error("password2", "Les mots de passe ne correspondent pas.")

        return cleaned_data


class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = ("username", "email", "role", "code_personnel")

    def clean(self):
        cleaned_data = super().clean()
        role = cleaned_data.get("role")
        code_personnel = cleaned_data.get("code_personnel")

        if role != "medecin" and code_personnel:
            self.add_error("code_personnel", "Seul un médecin peut avoir un code personnel.")

        return cleaned_data
