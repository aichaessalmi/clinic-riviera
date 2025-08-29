from django.db import models
from django.conf import settings

class Patient(models.Model):
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    birth_date = models.DateField(null=True, blank=True)
    insurance = models.CharField(max_length=120)  # obligatoire
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.last_name} {self.first_name} - {self.phone}"


class Appointment(models.Model):
    STATUS = (
        ("pending", "En attente"),
        ("confirmed", "Confirmé"),
        ("to_call", "À rappeler"),
        ("canceled", "Annulé"),
    )
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
    specialty = models.CharField(max_length=120)
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    date = models.DateTimeField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"RDV {self.patient} - {self.specialty} - {self.date:%Y-%m-%d %H:%M}"
