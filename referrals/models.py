from django.db import models
from django.conf import settings
from appointments.models import Patient

class Referral(models.Model):
    STATUS = (("waiting", "En attente"), ("arrived", "Arrivé"))

    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="referrals"
    )
    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name="referrals"
    )

    # Infos médicales liées à la demande
    intervention_type = models.CharField(max_length=100)
    urgency_level = models.CharField(
        max_length=20,
        choices=(("low", "Faible"), ("medium", "Moyen"), ("high", "Élevé")),
    )
    consultation_reason = models.TextField()

    # Assurance spécifique à la demande
    insurance_provider = models.CharField(max_length=120)

    # Système
    status = models.CharField(max_length=20, choices=STATUS, default="waiting")
    room_number = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Referral {self.patient} - {self.intervention_type} ({self.status})"
