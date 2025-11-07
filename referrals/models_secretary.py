# referrals/models_secretary.py
from django.db import models

class SecretaryReferral(models.Model):
    STATUT_CHOICES = [
        ("En attente", "En attente"),
        ("Confirmé", "Confirmé"),
        ("Terminé", "Terminé"),
        ("Annulé", "Annulé"),
        ("À rappeler", "À rappeler"),
    ]
    PRIORITE_CHOICES = [
        ("Basse", "Basse"),
        ("Normale", "Normale"),
        ("Haute", "Haute"),
        ("Urgente", "Urgente"),
    ]

    patient = models.CharField(max_length=100)
    medecin = models.CharField(max_length=100)
    intervention = models.CharField(max_length=200)
    date = models.DateTimeField()
    assurance = models.CharField(max_length=50)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="En attente")
    priorite = models.CharField(max_length=20, choices=PRIORITE_CHOICES, default="Normale")
    phone = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    internalNotes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "referrals"  # 👈 OBLIGATOIRE pour forcer l'app correcte
        ordering = ["-date"]

    def __str__(self):
        return f"{self.patient} — {self.medecin}"


