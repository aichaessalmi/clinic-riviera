# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
class Specialty(models.Model):
    name_fr = models.CharField("Nom (FR)", max_length=100)
    name_en = models.CharField("Name (EN)", max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Spécialité"
        verbose_name_plural = "Spécialités"
        ordering = ["name_fr"]

    def __str__(self):
        return self.name_fr
class User(AbstractUser):
    ROLE_CHOICES = [
        ("medecin", "Médecin"),
        ("secretaire", "Secrétaire"),
        ("direction", "Direction"),
    ]

    # ---------- Identité / rôle ----------
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    code_personnel = models.CharField(
        max_length=20, blank=True, null=True, unique=True,
        help_text="Obligatoire pour les médecins. Vide pour les autres rôles."
    )

    # ---------- Coordonnées / profil pro ----------
    telephone = models.CharField(
        max_length=30, blank=True, null=True,
        validators=[RegexValidator(r"^[0-9+ ()-]+$", "Numéro invalide")]
    )
    specialite = models.ForeignKey(
    "accounts.Specialty",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="users",
    verbose_name="Spécialité"
)


    departement = models.CharField(max_length=100, blank=True, null=True)
    licence_medicale = models.CharField(max_length=100, blank=True, null=True)
    date_adhesion = models.DateField(blank=True, null=True)
    poste = models.CharField(max_length=100, blank=True, null=True)

    # ---------- Préférences UI ----------
    LANG_CHOICES = [("fr", "Français"), ("en", "English")]
    THEME_CHOICES = [("light", "Clair"), ("dark", "Sombre"), ("auto", "Automatique")]
    langue = models.CharField(max_length=5, choices=LANG_CHOICES, default="fr")
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default="light")

    # ---------- Médias ----------
    photo = models.ImageField(upload_to="profiles/", blank=True, null=True)

    # ---------- Notifications ----------
    notifications = models.JSONField(default=dict, blank=True)

    def save(self, *args, **kwargs):
        # Normalisation rôle (sécurité)
        if self.role:
            self.role = self.role.lower()

        # Seul le médecin peut avoir un code_personnel
        if self.role != "medecin":
            self.code_personnel = None

        # Valeurs par défaut pour notifications
        if not self.notifications:
            self.notifications = {
                "email": True,
                "sms": False,
                "whatsapp": True,
                "rappels": True,
                "nouvelles": True,
            }
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        fn = (self.first_name or "").strip()
        ln = (self.last_name or "").strip()
        return (fn + " " + ln).strip() or self.username
