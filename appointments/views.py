from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q
from .models import Appointment
from .serializers import AppointmentSerializer
from accounts.permissions import IsDirectionOrSecretaire

class AppointmentViewSet(viewsets.ModelViewSet):
    """
    Back-office: Secrétaire + Direction
    CRUD sur les RDV (création interne, statut, etc.)
    """
    queryset = Appointment.objects.select_related("patient","doctor").order_by("-created_at")
    serializer_class = AppointmentSerializer
    permission_classes = [IsDirectionOrSecretaire]

class AppointmentPublicCreateView(APIView):
    """
    Endpoint public (WordPress/formulaire site) pour créer une demande de RDV.
    Pas d'authentification. Statut = pending.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()
        data["status"] = "pending"
        serializer = AppointmentSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        appt = serializer.save()
        return Response(AppointmentSerializer(appt).data, status=status.HTTP_201_CREATED)

class CalendarEventsView(APIView):
    """
    Renvoie les RDV sous forme d'événements (FullCalendar)
    Accès back-office: Secrétaire + Direction
    """
    permission_classes = [IsDirectionOrSecretaire]

    def get(self, request):
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")

        qs = Appointment.objects.select_related("patient")
        if date_from and date_to:
            qs = qs.filter(date__gte=date_from, date__lte=date_to)

        events = []
        for a in qs:
            title = f"{a.patient.last_name} {a.patient.first_name} - {a.specialty} ({a.status})"
            events.append({
                "id": a.id,
                "title": title,
                "start": a.date,
                "end": a.date,  # si tu veux une durée, ajoute un champ 'end'
                "status": a.status,
                "specialty": a.specialty,
                "patient": {
                    "id": a.patient.id,
                    "first_name": a.patient.first_name,
                    "last_name": a.patient.last_name,
                }
            })
        return Response(events)
