from django.utils import translation
from django.utils.dateparse import parse_datetime
from django.db.models import Count
from django.db.models.functions import TruncDate
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .models import Referral, InterventionType, UrgencyLevel, Insurance
from .serializers import (
    ReferralSerializer,
    ReferralCreateSerializer,
    InsuranceSerializer,
    InterventionTypeSerializer,
    UrgencyLevelSerializer,
)
from appointments.models import Appointment


# ======================================================
#   PERMISSIONS PERSONNALISÉES
# ======================================================

class IsMedecin(permissions.BasePermission):
    """Autorise uniquement les utilisateurs ayant le rôle 'MEDECIN'."""
    def has_permission(self, request, view):
        user = request.user
        role = getattr(user, "role", "").upper()
        print(f"🩺 [IsMedecin] user={user} role={role}")
        return bool(user and user.is_authenticated and role == "MEDECIN")


class IsDirection(permissions.BasePermission):
    """Autorise uniquement les utilisateurs ayant le rôle 'DIRECTION'."""
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "role", "").upper() == "DIRECTION")


class IsDirectionOrSecretaire(permissions.BasePermission):
    """Autorise les utilisateurs 'DIRECTION' ou 'SECRETAIRE'."""
    def has_permission(self, request, view):
        user = request.user
        role = getattr(user, "role", "").upper()
        return bool(user and user.is_authenticated and role in {"DIRECTION", "SECRETAIRE"})


# ======================================================
#   VIEWSET: INSURANCE
# ======================================================

class InsuranceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Insurance.objects.all().order_by("id")
    serializer_class = InsuranceSerializer
    permission_classes = [permissions.AllowAny]


# ======================================================
#   VIEWSET: REFERRALS
# ======================================================

class ReferralViewSet(viewsets.ModelViewSet):
    queryset = Referral.objects.all()
    serializer_class = ReferralSerializer

    def get_serializer_class(self):
        return ReferralCreateSerializer if self.action == "create" else ReferralSerializer

    def create(self, request, *args, **kwargs):
        print("🩺 [CREATE] user=", request.user)
        serializer = self.get_serializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            print("❌ Erreurs de validation :", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            instance = serializer.save()
            print(f"✅ Référence créée ID={instance.id}")
            return Response(ReferralSerializer(instance, context={"request": request}).data, status=201)
        except Exception as e:
            import traceback
            print("🔥 ERREUR CREATE REFERRAL:")
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)


# ======================================================
#   VIEW: REFERRAL STATS
# ======================================================

class ReferralStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        from_param = request.GET.get("from")
        to_param = request.GET.get("to")

        qs = Referral.objects.all()
        if from_param:
            start = parse_datetime(from_param)
            if start:
                qs = qs.filter(created_at__gte=start)
        if to_param:
            end = parse_datetime(to_param)
            if end:
                qs = qs.filter(created_at__lte=end)

        # Séries temporelles (date, referrals)
        daily = (
            qs.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(referrals=Count("id"))
            .order_by("day")
        )
        series = [{"date": d["day"].isoformat(), "referrals": d["referrals"], "confirmed": 0} for d in daily]

        # Par médecin
        by_doctor = [
            {"name": d["doctor__username"] or "—", "value": d["count"]}
            for d in qs.values("doctor__username").annotate(count=Count("id"))
        ]

        # Par spécialité (intervention)
        by_specialty = [
            {"name": s["intervention_type__name_fr"] or "Non défini", "value": s["count"]}
            for s in qs.values("intervention_type__name_fr").annotate(count=Count("id"))
        ]

        # Par assurance
        by_insurance = [
            {"name": s["insurance__insurance_provider"] or "—", "value": s["count"]}
            for s in qs.values("insurance__insurance_provider").annotate(count=Count("id"))
        ]

        # Funnel
        funnel = {
            "referrals": qs.count(),
            "appointments": Appointment.objects.count(),
            "arrived": qs.filter(status="arrived").count(),
        }

        facets = {
            "doctors": list(qs.exclude(doctor__username=None).values_list("doctor__username", flat=True).distinct()),
            "specialties": list(
                qs.exclude(intervention_type__name_fr=None)
                .values_list("intervention_type__name_fr", flat=True)
                .distinct()
            ),
            "insurances": list(
                qs.exclude(insurance__insurance_provider=None)
                .values_list("insurance__insurance_provider", flat=True)
                .distinct()
            ),
        }

        return Response({
            "series": series,
            "by_doctor": by_doctor,
            "by_specialty": by_specialty,
            "by_insurance": by_insurance,
            "funnel": funnel,
            "facets": facets,
        })


# ======================================================
#   VIEWSETS MULTI-LANGUE
# ======================================================

from django.utils import translation

class InterventionTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InterventionType.objects.all().order_by("name_fr")
    serializer_class = InterventionTypeSerializer

    def list(self, request, *args, **kwargs):
        lang = request.GET.get("lang") or request.headers.get("Accept-Language") or "fr"
        translation.activate(lang)
        # 👇 transmet la langue au serializer
        serializer = self.get_serializer(self.get_queryset(), many=True, context={"lang": lang})
        return Response(serializer.data)



class UrgencyLevelViewSet(viewsets.ReadOnlyModelViewSet):
    """Retourne les niveaux d’urgence traduits."""
    queryset = UrgencyLevel.objects.all().order_by("priority")
    serializer_class = UrgencyLevelSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def list(self, request, *args, **kwargs):
        lang = request.headers.get("Accept-Language") or request.GET.get("lang", "fr")
        translation.activate(lang)
        return super().list(request, *args, **kwargs)
