# referrals/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReferralViewSet,
    ReferralStatsView,
    InterventionTypeViewSet,
    UrgencyLevelViewSet,
    InsuranceViewSet,
)
from .views_secretary import SecretaryReferralViewSet
from .views_lookup import PatientListView, InterventionTypeListView, InsuranceListView

# ===== Router principal =====
router = DefaultRouter()
router.register(r"referrals", ReferralViewSet, basename="referrals")
router.register(r"interventions", InterventionTypeViewSet, basename="interventions")
router.register(r"urgencies", UrgencyLevelViewSet, basename="urgencies")
router.register(r"insurances", InsuranceViewSet, basename="insurances")
router.register(r"secretary-referrals", SecretaryReferralViewSet, basename="secretary-referrals")

# ===== URL patterns =====
urlpatterns = [
   path("referrals/stats/", ReferralStatsView.as_view(), name="referral-stats"),


    # Lookups pour le front React (patients, interventions, assurances)
    path("patients/", PatientListView.as_view(), name="patients"),
    path("interventions/", InterventionTypeListView.as_view(), name="interventions"),
    path("insurances/", InsuranceListView.as_view(), name="insurances"),

    # Regroupe toutes les routes DRF
    path("", include(router.urls)),
]
