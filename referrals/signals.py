from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Referral
from .models_secretary import SecretaryReferral

# --- helpers de mapping ---

def _status_to_fr(s: str) -> str:
    mapping = {
        "new": "En attente",
        "sent": "En attente",
        "accepted": "Confirmé",
        "rejected": "Annulé",
        "completed": "Terminé",
        "to_call": "À rappeler",
        "pending": "En attente",
        "confirmed": "Confirmé",
        "cancelled": "Annulé",
    }
    return mapping.get((s or "").lower(), "En attente")


def _safe_str(x):
    return "" if x is None else str(x)


def _build_patient_full_name(ref: Referral) -> str:
    """Construit le nom complet du patient sans erreur si la relation est manquante."""
    try:
        patient = ref.patient  # essaye d'accéder à la relation
        first = _safe_str(getattr(patient, "first_name", "")) or _safe_str(getattr(ref, "first_name", ""))
        last = _safe_str(getattr(patient, "last_name", "")) or _safe_str(getattr(ref, "last_name", ""))
    except Exception:
        # le patient a été supprimé ou n'existe plus
        first = _safe_str(getattr(ref, "first_name", ""))
        last = _safe_str(getattr(ref, "last_name", ""))
    full = f"{first} {last}".strip()
    return full or "Patient"


def _build_physician(ref: Referral) -> str:
    u = getattr(ref, "physician_user", None) or getattr(ref, "physician", None)
    if u and hasattr(u, "first_name"):
        fn = (u.first_name or "").strip()
        ln = (u.last_name or "").strip()
        name = (fn + " " + ln).strip() or getattr(u, "username", "")
        spec = getattr(u, "specialite", "") or getattr(getattr(u, "physicianprofile", None), "specialty", "")
        spec = getattr(spec, "name", spec) or ""
        return f"{name} — {spec}".strip(" —")
    txt = _safe_str(getattr(ref, "referring_doctor", "")) or _safe_str(getattr(ref, "doctor_full_name", ""))
    return txt or "Médecin"


def _insurance_label(ref: Referral) -> str:
    ins = getattr(ref, "insurance", None)
    if ins:
        prov = getattr(ins, "insurance_provider", None)
        if prov:
            return str(prov).upper()
    return (_safe_str(getattr(ref, "insurance_provider", "")) or "—").upper()


def _intervention_label(ref: Referral) -> str:
    it = getattr(ref, "intervention_type", None)
    if isinstance(it, str):
        return it
    return _safe_str(getattr(it, "name", "")) or _safe_str(getattr(ref, "consultation_reason", "")) or "Consultation"


def _urgency_to_priorite(ref: Referral) -> str:
    u = getattr(ref, "urgency_level", None)
    val = str(getattr(u, "code", u or "")).lower()
    if val in {"urgent", "urgence", "high"}:
        return "Urgente"
    if val in {"haute", "elevated"}:
        return "Haute"
    if val in {"low", "basse"}:
        return "Basse"
    return "Normale"


def _patient_phone(ref: Referral) -> str:
    p = getattr(ref, "patient", None)
    return _safe_str(getattr(p, "phone", "")) or _safe_str(getattr(ref, "phone", ""))


def _patient_email(ref: Referral) -> str:
    p = getattr(ref, "patient", None)
    return _safe_str(getattr(p, "email", "")) or _safe_str(getattr(ref, "email", ""))


def _notes(ref: Referral) -> str:
    return _safe_str(getattr(ref, "notes", "")) or _safe_str(getattr(ref, "medical_history", ""))


def _date_iso(ref: Referral) -> str:
    if getattr(ref, "created_at", None):
        return ref.created_at.isoformat()
    if getattr(ref, "updated_at", None):
        return ref.updated_at.isoformat()
    return _safe_str(getattr(ref, "date", "")) or _safe_str(getattr(ref, "appointment_date", "")) or ""


# --- sync vers SecretaryReferral ---

@receiver(post_save, sender=Referral)
def referral_to_secretary(sender, instance: Referral, created, **kwargs):
    defaults = {
        "patient": _build_patient_full_name(instance),
        "medecin": _build_physician(instance),
        "intervention": _intervention_label(instance),
        "date": _date_iso(instance),
        "assurance": _insurance_label(instance),
        "statut": _status_to_fr(getattr(instance, "status", "new")),
        "priorite": _urgency_to_priorite(instance),
        "phone": _patient_phone(instance),
        "email": _patient_email(instance),
        "internalNotes": _notes(instance),
    }

    if created:
        SecretaryReferral.objects.create(**defaults)
    else:
        SecretaryReferral.objects.filter(
            patient=defaults["patient"],
            medecin=defaults["medecin"],
            date=defaults["date"],
        ).update(**defaults)


@receiver(post_delete, sender=Referral)
def referral_delete_secretary(sender, instance: Referral, **kwargs):
    SecretaryReferral.objects.filter(
        patient=_build_patient_full_name(instance),
        medecin=_build_physician(instance),
        date=_date_iso(instance),
    ).delete()
