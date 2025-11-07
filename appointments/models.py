from django.db import models
from django.utils import timezone
from django.conf import settings


from django.utils.translation import gettext_lazy as _

class Room(models.Model):
    name_fr = models.CharField("Nom (FR)", max_length=120, unique=False)
    name_en = models.CharField("Name (EN)", max_length=120, blank=True, null=True)

    status = models.CharField(
        max_length=50,
        choices=[
            ("available", _("Disponible / Available")),
            ("occupied", _("Occupée / Occupied")),
            ("cleaning", _("Nettoyage / Cleaning")),
            ("maintenance", _("Maintenance / Maintenance")),
        ],
        default="available",
    )

    def __str__(self):
        return self.name_fr or self.name_en or "Salle"

class AppointmentType(models.Model):
    name_fr = models.CharField("Nom (FR)", max_length=120, unique=False)
    name_en = models.CharField("Name (EN)", max_length=120, blank=True, null=True)

    def __str__(self):
        # par défaut, montre le nom FR
        return self.name_fr or self.name_en or "Type"


class Patient(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    insurance = models.CharField(max_length=100, blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()


class Appointment(models.Model):
    patient = models.ForeignKey(
        "appointments.Patient",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments"
    )
    patient_name = models.CharField(max_length=120)
    date = models.DateField(default=timezone.now)
    time = models.TimeField()
    duration_minutes = models.PositiveIntegerField(default=30)
    status = models.CharField(
        max_length=30,
        choices=[
            ("pending", "Pending"),
            ("confirmed", "Confirmed"),
            ("to_call", "À rappeler"),
            ("cancelled", "Cancelled"),
        ],
        default="pending",
    )
    room = models.ForeignKey("appointments.Room", on_delete=models.SET_NULL, null=True, blank=True)
    type = models.ForeignKey("appointments.AppointmentType", on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reason = models.TextField(blank=True, null=True)

    # ✅ vrai lien vers médecin
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
        limit_choices_to={"role": "medecin"},
    )

    # (optionnel) ancien champ texte à supprimer plus tard
    physician = models.CharField(max_length=120, blank=True)

    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(("Email du patient"), blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        # 🟢 Enregistre le rendez-vous normalement
        super().save(*args, **kwargs)

        # ✅ Crée ou associe automatiquement un patient si non lié
        if self.patient is None and self.patient_name:
            first_name, *rest = self.patient_name.split(" ")
            last_name = " ".join(rest)
            from .models import Patient
            patient, _ = Patient.objects.get_or_create(
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                defaults={
                    "phone": self.phone,
                    "email": self.email,
                },
            )
            self.patient = patient
            super().save(update_fields=["patient"])

    def __str__(self):
        return f"{self.patient_name} - {self.date} {self.time}"
