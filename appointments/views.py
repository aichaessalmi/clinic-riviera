# appointments/views.py
from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny  # ou IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend

from .models import Room, AppointmentType, Appointment
from .serializers import (
    RoomSerializer,
    AppointmentTypeSerializer,
    AppointmentSerializer,
)


# ---------------------------
# 🔹 Salles
# ---------------------------
class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by("id")
    serializer_class = RoomSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request  # ✅ indispensable pour détecter Accept-Language
        return ctx

from .models import Patient
from .serializers import PatientSerializer
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
# ---------------------------
# 🔹 Types de rendez-vous
# ---------------------------
class AppointmentTypeViewSet(viewsets.ModelViewSet):
    queryset = AppointmentType.objects.all().order_by("id")
    serializer_class = AppointmentTypeSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request  # ✅ pour lire Accept-Language
        return ctx

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by("last_name")
    serializer_class = PatientSerializer
    permission_classes = [AllowAny]

# ---------------------------
# 🔹 Rendez-vous
# ---------------------------
from django.db.models import Q

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [AllowAny]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        "date": ["gte", "lte", "exact"],
        "status": ["exact"],
        "doctor": ["exact"],
        "room": ["exact"],
        "type": ["exact"],  # garde-le pour filtrage par ID
    }
    ordering_fields = ["date", "time", "id"]
    ordering = ["-date", "-time", "-id"]

    def get_queryset(self):
        qs = (
            Appointment.objects
            .select_related("room", "type", "doctor")
            .order_by("-date", "-time", "-id")
        )

        params = self.request.query_params
        date_after = params.get("date_after")
        date_before = params.get("date_before")
        intervention = params.get("type")  # peut être nom ou ID

        if date_after:
            qs = qs.filter(date__gte=date_after)
        if date_before:
            qs = qs.filter(date__lte=date_before)

        # ✅ Filtrage intelligent par nom du type (FR / EN)
        if intervention:
            if intervention.isdigit():
                qs = qs.filter(type_id=intervention)
            else:
                qs = qs.filter(
                    Q(type__name_fr__icontains=intervention)
                    | Q(type__name_en__icontains=intervention)
                )

        return qs

