# notifications/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import datetime, time as dtime

from appointments.models import Appointment
from notifications.models import ArrivalNotification  # ton modèle réel


def _combine_date_time(d, t):
    """Combine une date et une heure en datetime timezone-aware."""
    if isinstance(d, str):
        d = datetime.fromisoformat(d).date()
    if isinstance(t, str):
        h, m = [int(x) for x in t.split(":")[:2]]
        t = dtime(hour=h, minute=m)
    dt = datetime.combine(d, t)
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    return dt


@receiver(post_save, sender=Appointment)
def appointment_to_arrival(sender, instance: Appointment, created, **kwargs):
    """
    🔹 Crée automatiquement une ArrivalNotification à la création d’un rendez-vous.
    """
    # on ne crée la notif qu’à la création initiale
    if not created:
        return

    doctor_user = instance.doctor
    if not doctor_user:
        print("⚠️ Aucun docteur associé → pas de notification.")
        return

    # combine date + time
    appt_at = _combine_date_time(instance.date, instance.time)

    # ✅ on passe directement la salle (même si None)
    ArrivalNotification.objects.create(
        doctor=doctor_user,
        status="new",
        patient=instance.patient_name or "—",
        ref_by=f"{doctor_user.first_name} {doctor_user.last_name}".strip(),
        room=instance.room,  # FK → appointments.Room
        speciality=(instance.type.name if instance.type_id else ""),
        appt_at=appt_at,
        message=f"Nouveau rendez-vous confirmé pour {instance.patient_name}.",
        created_by=None,
    )

    # ✅ Si la salle existe, on la marque comme occupée
    if instance.room:
        instance.room.status = "occupied"
        instance.room.save(update_fields=["status"])

    print(f"✅ Notification créée pour {doctor_user.email} ({instance.patient_name}) à {appt_at}.")
