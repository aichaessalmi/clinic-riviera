from rest_framework import serializers
from .models import Room, AppointmentType, Appointment, Patient
from django.db import models
from django.utils.translation import get_language


# ----------------------------
# 🔹 Room
# ----------------------------
class RoomSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ["id", "name", "status", "status_label"]

    def get_name(self, obj):
        request = self.context.get("request")
        lang = "fr"
        if request:
            lang = request.headers.get("Accept-Language", "fr").lower()

        return obj.name_en if lang.startswith("en") else obj.name_fr

    def get_status_label(self, obj):
        request = self.context.get("request")
        lang = "fr"
        if request:
            lang = request.headers.get("Accept-Language", "fr").lower()

        translations = {
            "available": {"fr": "Disponible", "en": "Available"},
            "occupied": {"fr": "Occupée", "en": "Occupied"},
            "cleaning": {"fr": "Nettoyage", "en": "Cleaning"},
            "maintenance": {"fr": "Maintenance", "en": "Maintenance"},
        }
        return translations.get(obj.status, {}).get(lang[:2], obj.status)


# ----------------------------
# 🔹 Appointment Type
# ----------------------------
class AppointmentTypeSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = AppointmentType
        fields = ["id", "name"]

    def get_name(self, obj):
        request = self.context.get("request")
        lang = "fr"
        if request:
            lang = request.headers.get("Accept-Language", "fr").lower()
        return obj.name_en if lang.startswith("en") else obj.name_fr


# ----------------------------
# 🔹 Patient
# ----------------------------
class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = "__all__"


# ----------------------------
# 🔹 Appointment
# ----------------------------
class AppointmentSerializer(serializers.ModelSerializer):
    # champs additionnels pour le front
    room_name = serializers.CharField(source="room.name", read_only=True)
    type_name = serializers.CharField(source="type.name", read_only=True)
    doctor_full_name = serializers.SerializerMethodField()
    doctor_specialty = serializers.SerializerMethodField()
    physician_display = serializers.SerializerMethodField()
    patient = PatientSerializer(read_only=True)

    # ✅ Champs multilingues pour export / mobile
    room_label = serializers.SerializerMethodField()
    type_label = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient", "patient_name",
            "date", "time", "duration_minutes",
            "status",
            "room", "room_name", "room_label",
            "type", "type_name", "type_label",
            "doctor", "doctor_full_name", "doctor_specialty", "physician_display",
            "phone", "email",
            "reason", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "room_name", "room_label",
            "type_name", "type_label",
            "doctor_full_name",
            "doctor_specialty",
            "physician_display",
        ]

    # -----------------------
    # Méthodes utilitaires
    # -----------------------
    def _get_user_full_name(self, user):
        if not user:
            return None
        full_name = f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
        return full_name or getattr(user, "username", None)

    def _get_user_specialty(self, user):
        if not user:
            return None
        specialty = getattr(user, "specialty", None)
        if specialty:
            return getattr(specialty, "name", specialty)
        profile = getattr(user, "profile", None)
        if profile and getattr(profile, "specialty", None):
            return getattr(profile.specialty, "name", None)
        return None

    # -----------------------
    # Champs dynamiques
    # -----------------------
    def get_doctor_full_name(self, obj):
        if obj.doctor:
            return self._get_user_full_name(obj.doctor)
        return obj.physician or None

    def get_doctor_specialty(self, obj):
        if obj.doctor:
            return self._get_user_specialty(obj.doctor)
        return None

    def get_physician_display(self, obj):
        full = self.get_doctor_full_name(obj) or ""
        spec = self.get_doctor_specialty(obj) or ""
        return f"{full} — {spec}".strip(" —") or "-"

    # ✅ Label multilingue salle
    def get_room_label(self, obj):
        if not obj.room:
            return "-"
        request = self.context.get("request")
        lang = request.headers.get("Accept-Language", "fr").lower() if request else "fr"
        return obj.room.name_en if lang.startswith("en") else obj.room.name_fr

    # ✅ Label multilingue type d’intervention
    def get_type_label(self, obj):
        if not obj.type:
            return "-"
        request = self.context.get("request")
        lang = request.headers.get("Accept-Language", "fr").lower() if request else "fr"
        return obj.type.name_en if lang.startswith("en") else obj.type.name_fr

    # -----------------------
    # Création avec mappage automatique
    # -----------------------
    def create(self, validated_data):
        physician_name = self.initial_data.get("physician")
        if physician_name and not validated_data.get("doctor"):
            from accounts.models import User
            doctor = User.objects.filter(role="medecin").filter(
                models.Q(first_name__icontains=physician_name)
                | models.Q(last_name__icontains=physician_name)
            ).first()
            if doctor:
                validated_data["doctor"] = doctor
                print(f"✅ Docteur associé automatiquement : {doctor}")

        instance = super().create(validated_data)
        print(f"📅 RDV créé pour {instance.patient_name} ({instance.type}) → médecin={instance.doctor}")
        return instance
