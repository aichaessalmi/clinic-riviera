# referrals/serializers_secretary.py
from rest_framework import serializers
from .models_secretary import SecretaryReferral

class SecretaryReferralSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecretaryReferral
        fields = "__all__"
