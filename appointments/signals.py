from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import datetime, time as dtime
from django.contrib.auth import get_user_model
from .models import Appointment
from notifications.models import ArrivalNotification

print("📡 Signal Appointment → ArrivalNotification bien importé ✅")

User = get_user_model()


def _combine_date_time(d, t):
    """Combine date et time en datetime aware."""
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
    print(f"🚀 Signal déclenché → created={created}, doctor={instance.doctor}")

    if not created or not instance.doctor:
        return

    appt_at = _combine_date_time(instance.date, instance.time)

    ArrivalNotification.objects.create(
        doctor=instance.doctor,
        status="new",
        patient=instance.patient_name or "—",
        ref_by=f"{instance.doctor.first_name} {instance.doctor.last_name}".strip(),
        room=instance.room,
        intervention_type=instance.type,  # ✅ on envoie l’objet AppointmentType
        appt_at=appt_at,
        message=f"Nouveau rendez-vous confirmé ({instance.type.name_fr if instance.type else '—'}) pour {instance.patient_name}.",
        created_by=None,
    )

    print(f"✅ Notification créée pour {instance.doctor.email} ({instance.patient_name})")
