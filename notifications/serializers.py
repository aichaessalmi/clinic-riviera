from rest_framework import serializers
from .models import ArrivalNotification

class ArrivalNotificationSerializer(serializers.ModelSerializer):
    refBy = serializers.CharField(source='ref_by')
    apptAt = serializers.DateTimeField(source='appt_at')
    createdAt = serializers.DateTimeField(source='created_at')

    roomLabel = serializers.SerializerMethodField()
    interventionLabel = serializers.SerializerMethodField()  # ✅

    class Meta:
        model = ArrivalNotification
        fields = [
            "id", "status",
            "patient", "refBy",
            "roomLabel", "interventionLabel",
            "apptAt", "createdAt",
            "message", "notes",
        ]

    def _get_lang(self):
        request = self.context.get("request")
        lang = "fr"
        if request:
            lang = request.headers.get("Accept-Language", "fr").lower()
        return lang

    def get_roomLabel(self, obj):
        lang = self._get_lang()
        if not obj.room:
            return "—"
        return obj.room.name_en if lang.startswith("en") else obj.room.name_fr

    def get_interventionLabel(self, obj):
        lang = self._get_lang()
        if not obj.intervention_type:
            return "—"
        return (
            obj.intervention_type.name_en
            if lang.startswith("en")
            else obj.intervention_type.name_fr
        )
