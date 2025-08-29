# referrals/admin.py
from django.contrib import admin
from .models import Referral

@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ("patient", "intervention_type", "insurance_provider", "status", "created_at")
    list_filter = ("status", "urgency_level", "insurance_provider")
    search_fields = ("patient__first_name", "patient__last_name", "intervention_type", "insurance_provider", "referring_doctor")
