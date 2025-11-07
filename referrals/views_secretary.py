# referrals/views_secretary.py
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Referral  # ✅ on reste dans referrals.models
from .serializers import ReferralSerializer  # ✅ ton serializer déjà existant


class SecretaryReferralViewSet(viewsets.ModelViewSet):
    """
    Vue utilisée par le secrétariat pour afficher / modifier
    toutes les références créées par les médecins.
    """
    queryset = Referral.objects.all().order_by("-id")
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """
        Liste toutes les références disponibles (vue secrétariat)
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
