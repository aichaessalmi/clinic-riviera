from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


# =======================
#   PATIENT
# =======================
class Patient(models.Model):
    GENDER_CHOICES = (
        ("male", _("Homme")),
        ("female", _("Femme")),
        ("other", _("Autre")),
        ("", _("Non précisé")),
    )

    first_name = models.CharField(_("Prénom"), max_length=120)
    last_name = models.CharField(_("Nom de famille"), max_length=120)
    birth_date = models.DateField(_("Date de naissance"), null=True, blank=True)
    gender = models.CharField(_("Genre"), max_length=10, choices=GENDER_CHOICES, default="", blank=True)
    phone = models.CharField(_("Téléphone"), max_length=50, blank=True)
    email = models.EmailField(_("Email"), blank=True)
    address = models.CharField(_("Adresse"), max_length=255, blank=True)
    city = models.CharField(_("Ville"), max_length=120, blank=True)
    postal_code = models.CharField(_("Code postal"), max_length=30, blank=True)

    class Meta:
        verbose_name = _("Patient")
        verbose_name_plural = _("Patients")

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()


# =======================
#   INSURANCE
# =======================
class Insurance(models.Model):
    PROVIDERS = (
        ("cnss", "CNSS"),
        ("cnops", "CNOPS"),
        ("axa", "AXA"),
        ("saham", "Saham"),
        ("", "—"),
    )

    insurance_provider = models.CharField(_("Fournisseur d'assurance"), max_length=20, choices=PROVIDERS, default="", blank=True)
    insurance_policy_number = models.CharField(_("Numéro de police"), max_length=120, blank=True)
    coverage_type = models.CharField(_("Type de couverture"), max_length=120, blank=True)
    expiration_date = models.DateField(_("Date d'expiration"), null=True, blank=True)
    holder_name = models.CharField(_("Titulaire"), max_length=120, blank=True)
    insurance_notes = models.TextField(_("Notes"), blank=True)

    class Meta:
        verbose_name = _("Assurance")
        verbose_name_plural = _("Assurances")

    def __str__(self):
        return self.insurance_policy_number or _("Assurance")


# =======================
#   INTERVENTION TYPE
# =======================
from django.db import models
from django.utils import translation

class InterventionType(models.Model):
    name_fr = models.CharField(max_length=100, unique=True)
    name_en = models.CharField(max_length=100, blank=True, null=True)
    description_fr = models.TextField(blank=True)
    description_en = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Type d’intervention"
        verbose_name_plural = "Types d’interventions"

    def __str__(self):
        lang = translation.get_language()
        if lang == "en" and self.name_en:
            return self.name_en
        return self.name_fr


# =======================
#   URGENCY LEVEL
# =======================
class UrgencyLevel(models.Model):
    name_fr = models.CharField(_("Nom (français)"), max_length=50, unique=True)
    name_en = models.CharField(_("Nom (anglais)"), max_length=50, blank=True, null=True)
    color = models.CharField(_("Couleur"), max_length=20, blank=True, help_text=_("Ex : rouge, orange, vert"))
    priority = models.PositiveIntegerField(_("Priorité"), default=1, help_text=_("Plus petit = plus urgent"))

    class Meta:
        ordering = ["priority"]
        verbose_name = _("Niveau d’urgence")
        verbose_name_plural = _("Niveaux d’urgence")

    def __str__(self):
        from django.utils import translation
        lang = translation.get_language() or "fr"
        return self.name_en if lang.startswith("en") and self.name_en else self.name_fr


# =======================
#   REFERRAL
# =======================
class Referral(models.Model):
    class Status(models.TextChoices):
        NEW = "new", _("Nouveau")
        SENT = "sent", _("Envoyé")
        ACCEPTED = "accepted", _("Accepté")
        REJECTED = "rejeté", _("Rejeté")
        ARRIVED = "arrived", _("Arrivé")

    # --- Liens principaux ---
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="referrals",
        null=True,
        blank=True,
        verbose_name=_("Patient"),
    )
    insurance = models.ForeignKey(
        Insurance,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referrals",
        verbose_name=_("Assurance"),
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referrals",
        verbose_name=_("Médecin créateur"),
    )

    # --- Données médicales dynamiques ---
    intervention_type = models.ForeignKey(
        InterventionType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referrals",
        verbose_name=_("Type d’intervention"),
    )
    urgency_level = models.ForeignKey(
        UrgencyLevel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referrals",
        verbose_name=_("Niveau d’urgence"),
    )

    consultation_reason = models.TextField(_("Motif de consultation"), blank=True)
    medical_history = models.TextField(_("Antécédents médicaux"), blank=True)
    referring_doctor = models.CharField(_("Médecin référent"), max_length=120, blank=True)
    establishment = models.CharField(_("Établissement"), max_length=120, blank=True)

    # --- Détails logistiques ---
    room_number = models.CharField(_("Numéro de chambre"), max_length=20, blank=True)

    # --- Héritage ancien schéma ---
    physician = models.CharField(_("Médecin"), max_length=120, blank=True)
    target_specialty = models.CharField(_("Spécialité cible"), max_length=120, blank=True)
    notes = models.TextField(_("Notes supplémentaires"), blank=True)

    status = models.CharField(_("Statut"), max_length=20, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(_("Date de création"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Dernière mise à jour"), auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("Référence")
        verbose_name_plural = _("Références")

    def __str__(self):
        return f"Référence #{self.pk} — {self.patient or 'N/A'} ({self.get_status_display()})"
