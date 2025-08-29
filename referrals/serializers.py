# referrals/serializers.py
from rest_framework import serializers
from .models import Referral

class ReferralSerializer(serializers.ModelSerializer):
    doctor_username = serializers.CharField(source="doctor.username", read_only=True)

    class Meta:
        model = Referral
        fields = "__all__"
        read_only_fields = ("status", "room_number", "created_at", "doctor")

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["doctor"] = request.user
        return super().create(validated_data)
