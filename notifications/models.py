# notifications/models.py
from django.db import models
from django.contrib.auth import get_user_model
from appointments.models import Room, AppointmentType  # ✅ importe le bon modèle

User = get_user_model()

class ArrivalNotification(models.Model):
    STATUS_CHOICES = [
        ("new", "new"),
        ("ack", "ack"),
        ("read", "read"),
    ]

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="new")
    doctor = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name="arrival_notifications", null=True, blank=True
    )
    patient = models.CharField(max_length=150)
    ref_by = models.CharField(max_length=150, blank=True)

    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    intervention_type = models.ForeignKey(  # ✅ nouveau champ
        AppointmentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
        verbose_name="Type d’intervention"
    )

    appt_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    message = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="arrival_notifs"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        doc = f" → @{self.doctor.username}" if self.doctor_id else ""
        return f"[{self.status}] {self.patient}{doc}"
