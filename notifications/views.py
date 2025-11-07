from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models  # ✅ nécessaire pour Q(...)
from .models import ArrivalNotification
from .serializers import ArrivalNotificationSerializer


class ArrivalNotificationViewSet(viewsets.ModelViewSet):
    """Gestion des notifications d'arrivée (filtrées selon le rôle utilisateur)"""
    serializer_class = ArrivalNotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrage intelligent selon le rôle et le type d’intervention."""
        qs = ArrivalNotification.objects.select_related(
            "room", "doctor", "intervention_type"
        ).order_by("-created_at")

        user = self.request.user
        lang = self.request.headers.get("Accept-Language", "fr")

        print(f"🟢 HEADER REÇU: {lang}")
        print(f"🧩 Utilisateur connecté: {user.username if user.is_authenticated else 'Anonyme'}")

        # 🔹 Filtrage par type d’intervention (FR/EN)
        intervention = self.request.query_params.get("intervention_type")
        if intervention:
            qs = qs.filter(
                models.Q(intervention_type__name_fr__icontains=intervention)
                | models.Q(intervention_type__name_en__icontains=intervention)
            )

        # 🔹 Filtrage selon le rôle utilisateur
        if not user.is_authenticated:
            return ArrivalNotification.objects.none()

        role = getattr(user, "role", "")
        if role in ["direction", "secretaire"]:
            return qs
        if role == "medecin":
            qs = qs.filter(doctor=user)

        return qs

    def get_serializer_context(self):
        """✅ Envoie la requête au serializer pour la gestion des langues."""
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        print("💜 CONTEXT REQUEST:", bool(ctx["request"]))
        return ctx

    # ----------- ACTIONS PERSONNALISÉES -----------

    @action(detail=True, methods=["patch", "post"])
    def ack(self, request, pk=None):
        """Marquer une notification comme 'ack' (accusé de réception)."""
        notif = self.get_object()
        notif.status = "ack"
        notif.save(update_fields=["status"])
        return Response(self.get_serializer(notif).data)

    @action(detail=True, methods=["patch", "post"])
    def read(self, request, pk=None):
        """Marquer une notification comme 'read'."""
        notif = self.get_object()
        notif.status = "read"
        notif.save(update_fields=["status"])
        return Response(self.get_serializer(notif).data)

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        """Marquer toutes les notifications comme lues."""
        qs = self.get_queryset()
        updated = qs.exclude(status="read").update(status="read")
        return Response({"updated": updated}, status=status.HTTP_200_OK)
