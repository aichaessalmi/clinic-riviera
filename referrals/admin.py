from django.contrib import admin
from .models import Patient, Insurance, Referral, InterventionType, UrgencyLevel


# =======================
#   PATIENT
# =======================
@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "phone", "city", "gender")
    search_fields = ("first_name", "last_name", "phone", "email")
    list_filter = ("city", "gender")
    ordering = ("last_name",)


# =======================
#   INSURANCE
# =======================
@admin.register(Insurance)
class InsuranceAdmin(admin.ModelAdmin):
    list_display = ("insurance_provider", "insurance_policy_number", "holder_name", "expiration_date")
    search_fields = ("insurance_policy_number", "holder_name")
    list_filter = ("insurance_provider",)
    date_hierarchy = "expiration_date"


# =======================
#   REFERRAL
# =======================
@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "patient",
        "doctor",
        "intervention_type",
        "urgency_level",
        "status",
        "created_at",
    )
    search_fields = (
        "patient__first_name",
        "patient__last_name",
        "referring_doctor",
        "establishment",
        "notes",
    )
    list_filter = (
        "status",
        "intervention_type",
        "urgency_level",
        "created_at",
    )
    date_hierarchy = "created_at"
    ordering = ("-created_at",)


# =======================
#   INTERVENTION TYPE
# =======================
@admin.register(InterventionType)
class InterventionTypeAdmin(admin.ModelAdmin):
    list_display = ("name_fr", "name_en", "description_fr", "description_en")
    ordering = ("name_fr",)


# =======================
#   URGENCY LEVEL
# =======================
from django.utils.translation import gettext_lazy as _

@admin.register(UrgencyLevel)
class UrgencyLevelAdmin(admin.ModelAdmin):
    list_display = ("translated_name", "color", "priority")

    def translated_name(self, obj):
        from django.utils import translation
        lang = translation.get_language() or "fr"
        if lang.startswith("en") and obj.name_en:
            return obj.name_en
        return obj.name_fr or obj.name_en

    translated_name.short_description = _("Nom")
