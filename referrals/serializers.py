from datetime import datetime, date
from rest_framework import serializers
from django.utils import translation
from django.utils.translation import gettext_lazy as _
from .models import Referral, Patient, Insurance, InterventionType, UrgencyLevel


# ============================================================
# 🔹 Champ date tolérant
# ============================================================
class FlexibleDateField(serializers.DateField):
    """
    Accepte:
      - None / ""  -> None
      - 'YYYY-MM-DD'
      - 'DD/MM/YYYY'
      - ISO avec 'T' (ex: '2025-10-15T00:00:00Z')
    """
    def to_internal_value(self, value):
        if value in (None, ""):
            return None
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            s = value.strip()
            if "T" in s:
                s = s.split("T", 1)[0]
            for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
                try:
                    return datetime.strptime(s, fmt).date()
                except ValueError:
                    pass
        return super().to_internal_value(value)


# ============================================================
# 🔹 SERIALIZERS DE BASE
# ============================================================
class PatientSerializer(serializers.ModelSerializer):
    gender_label = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "id", "first_name", "last_name", "birth_date", "gender",
            "gender_label", "phone", "email", "address", "city", "postal_code",
        ]

    def get_gender_label(self, obj):
        request = self.context.get("request")
        lang = getattr(request, "LANGUAGE_CODE", None) or request.headers.get("Accept-Language", "fr")

        if str(lang).startswith("en"):
            mapping = {"male": "Male", "female": "Female", "other": "Other"}
        else:
            mapping = {"male": "Homme", "female": "Femme", "other": "Autre"}

        return mapping.get(obj.gender, "")


class InsuranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insurance
        fields = [
            "id", "insurance_provider", "insurance_policy_number",
            "coverage_type", "expiration_date", "holder_name", "insurance_notes",
        ]


# ============================================================
# 🔹 INTERVENTION TYPE (multi-langue)
# ============================================================
class InterventionTypeSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = InterventionType
        fields = ["id", "name", "description"]

    def get_name(self, obj):
        request = self.context.get("request")
        lang = getattr(request, "LANGUAGE_CODE", None) or request.headers.get("Accept-Language", "fr")

        if str(lang).startswith("en"):
            return obj.name_en or obj.name_fr or ""
        return obj.name_fr or obj.name_en or ""

    def get_description(self, obj):
        request = self.context.get("request")
        lang = getattr(request, "LANGUAGE_CODE", None) or request.headers.get("Accept-Language", "fr")

        if str(lang).startswith("en"):
            return obj.description_en or obj.description_fr or ""
        return obj.description_fr or obj.description_en or ""


# ============================================================
# 🔹 URGENCY LEVEL
# ============================================================
class UrgencyLevelSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = UrgencyLevel
        fields = ["id", "name", "color", "priority"]

    def get_name(self, obj):
        request = self.context.get("request")
        lang = getattr(request, "LANGUAGE_CODE", None) or request.headers.get("Accept-Language", "fr")

        if str(lang).startswith("en") and obj.name_en:
            return obj.name_en
        return obj.name_fr or obj.name_en or ""


# ============================================================
# 🔹 REFERRAL SERIALIZER (lecture)
# ============================================================
class ReferralSerializer(serializers.ModelSerializer):
    patient = PatientSerializer()
    insurance = InsuranceSerializer(allow_null=True)
    intervention_type = InterventionTypeSerializer()
    urgency_level = UrgencyLevelSerializer()
    intervention_label = serializers.SerializerMethodField()
    urgency_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = Referral
        fields = [
            "id", "status", "status_label", "created_at", "updated_at", "room_number",
            "intervention_type", "intervention_label",
            "urgency_level", "urgency_label",
            "consultation_reason", "medical_history",
            "referring_doctor", "establishment",
            "physician", "target_specialty", "notes",
            "patient", "insurance",
        ]

    def get_status_label(self, obj):
        return obj.get_status_display()

    def get_intervention_label(self, obj):
        if not obj.intervention_type:
            return ""
        lang = translation.get_language() or "fr"
        if lang.startswith("en"):
            return getattr(obj.intervention_type, "name_en", None) or getattr(obj.intervention_type, "name_fr", "")
        return getattr(obj.intervention_type, "name_fr", None) or getattr(obj.intervention_type, "name_en", "")

    def get_urgency_label(self, obj):
        if not obj.urgency_level:
            return ""
        lang = translation.get_language() or "fr"
        if lang.startswith("en"):
            return getattr(obj.urgency_level, "name_en", None) or getattr(obj.urgency_level, "name_fr", "")
        return getattr(obj.urgency_level, "name_fr", None) or getattr(obj.urgency_level, "name_en", "")


# ============================================================
# 🔹 REFERRAL SERIALIZER (création)
# ============================================================
class ReferralCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    birth_date = FlexibleDateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=["male", "female", "other", ""], default="", allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    postal_code = serializers.CharField(required=False, allow_blank=True)

    intervention_type = serializers.CharField()
    urgency_level = serializers.CharField()
    consultation_reason = serializers.CharField()
    medical_history = serializers.CharField(required=False, allow_blank=True)
    referring_doctor = serializers.CharField(required=False, allow_blank=True)
    establishment = serializers.CharField(required=False, allow_blank=True)

    insurance_provider = serializers.ChoiceField(
        choices=["cnss", "cnops", "axa", "saham", ""], allow_blank=True, required=False
    )
    insurance_policy_number = serializers.CharField(required=False, allow_blank=True)
    coverage_type = serializers.CharField(required=False, allow_blank=True)
    expiration_date = FlexibleDateField(required=False, allow_null=True)
    holder_name = serializers.CharField(required=False, allow_blank=True)
    insurance_notes = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        iv_val = validated_data.get("intervention_type")
        ug_val = validated_data.get("urgency_level")

        # ✅ Recherche intervention multi-langue
        intervention = None
        for field in ["id", "name_fr", "name_en"]:
            try:
                if field == "id" and str(iv_val).isdigit():
                    intervention = InterventionType.objects.get(id=int(iv_val))
                    break
                elif field != "id":
                    intervention = InterventionType.objects.filter(**{f"{field}__iexact": iv_val}).first()
                    if intervention:
                        break
            except InterventionType.DoesNotExist:
                pass

        # ✅ Recherche urgence multi-langue
        urgency = None
        for field in ["id", "name_fr", "name_en"]:
            try:
                if field == "id" and str(ug_val).isdigit():
                    urgency = UrgencyLevel.objects.get(id=int(ug_val))
                    break
                elif field != "id":
                    urgency = UrgencyLevel.objects.filter(**{f"{field}__iexact": ug_val}).first()
                    if urgency:
                        break
            except UrgencyLevel.DoesNotExist:
                pass

        # ✅ Création du patient
        patient, _ = Patient.objects.get_or_create(
            first_name=(validated_data.get("first_name") or "").strip(),
            last_name=(validated_data.get("last_name") or "").strip(),
            birth_date=validated_data.get("birth_date"),
            defaults={
                "gender": validated_data.get("gender", ""),
                "phone": validated_data.get("phone", ""),
                "email": validated_data.get("email", ""),
                "address": validated_data.get("address", ""),
                "city": validated_data.get("city", ""),
                "postal_code": validated_data.get("postal_code", ""),
            },
        )

        # ✅ Assurance (réutilisation si déjà existante)
        insurance = None
        if any(
            validated_data.get(k) not in (None, "", [])
            for k in ["insurance_provider", "insurance_policy_number", "coverage_type",
                      "expiration_date", "holder_name", "insurance_notes"]
        ):
            insurance, _ = Insurance.objects.get_or_create(
                insurance_provider=validated_data.get("insurance_provider", "").strip().lower(),
                insurance_policy_number=validated_data.get("insurance_policy_number", "").strip(),
                defaults={
                    "coverage_type": validated_data.get("coverage_type", "").strip(),
                    "expiration_date": validated_data.get("expiration_date"),
                    "holder_name": validated_data.get("holder_name", "").strip(),
                    "insurance_notes": validated_data.get("insurance_notes", "").strip(),
                },
            )

        # ✅ Création de la référence
        ref = Referral.objects.create(
            patient=patient,
            insurance=insurance,
            doctor=user if (user and getattr(user, "is_authenticated", False)) else None,
            intervention_type=intervention,
            urgency_level=urgency,
            consultation_reason=validated_data.get("consultation_reason", ""),
            medical_history=validated_data.get("medical_history", ""),
            referring_doctor=validated_data.get("referring_doctor", ""),
            establishment=validated_data.get("establishment", ""),
            physician=getattr(user, "get_full_name", lambda: "")() or getattr(user, "email", ""),
            target_specialty=getattr(intervention, "name_fr", ""),
            notes="",
            status=Referral.Status.NEW,
        )
        return ref

    def to_representation(self, instance):
        return ReferralSerializer(instance, context=self.context).data
