from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count
from .models import Referral
from .serializers import ReferralSerializer
from accounts.permissions import IsMedecin, IsDirection, IsDirectionOrSecretaire
from utils.whatsapp import notify_doctor_whatsapp

class ReferralViewSet(viewsets.ModelViewSet):
    """
    - Médecin: list/create ses propres références
    - Secrétaire/Direction: peuvent consulter tous (list) si besoin
    """
    serializer_class = ReferralSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Referral.objects.select_related("doctor").order_by("-created_at")
        if not user.is_authenticated:
            return Referral.objects.none()
        if user.role == "MEDECIN":
            return qs.filter(doctor=user)
        # Secrétaire / Direction voient tout
        return qs

    def get_permissions(self):
        if self.action in {"create"}:
            return [IsMedecin()]
        if self.action in {"list","retrieve"}:
            # médecin voit ses refs; secré/direction voient tout
            return [IsMedecin() or IsDirectionOrSecretaire()]
        if self.action in {"partial_update","update","destroy"}:
            # rarement utilisé; on peut restreindre aux rôles internes
            return [IsDirectionOrSecretaire()]
        return super().get_permissions()

    @action(detail=True, methods=["post"], permission_classes=[IsDirectionOrSecretaire])
    def arrive(self, request, pk=None):
        """
        Secrétaire/Direction marquent 'arrived' + room_number et notifient le médecin
        """
        try:
            ref = Referral.objects.select_related("doctor").get(pk=pk)
        except Referral.DoesNotExist:
            return Response({"detail": "Référence introuvable."}, status=status.HTTP_404_NOT_FOUND)

        room = request.data.get("room_number")
        if not room:
            return Response({"detail": "room_number est requis."}, status=status.HTTP_400_BAD_REQUEST)

        ref.status = "arrived"
        ref.room_number = room
        ref.save()

        # Notifier le médecin (stub)
        # Ici, mets le téléphone du médecin si tu l'ajoutes au modèle User plus tard
        notify_doctor_whatsapp(to_phone="", message=f"Votre patient '{ref.patient_name}' est arrivé (chambre {room}).")

        return Response(ReferralSerializer(ref).data, status=status.HTTP_200_OK)

class ReferralStatsView(APIView):
    """
    Direction: statistiques par médecin et par type d'intervention
    """
    permission_classes = [IsDirection]

    def get(self, request):
        by_doctor = (
            Referral.objects.values("doctor__id","doctor__username")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        by_intervention = (
            Referral.objects.values("intervention")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        return Response({"by_doctor": list(by_doctor), "by_intervention": list(by_intervention)})
