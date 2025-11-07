# accounts/serializers.py
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Specialty  # Ajout de Specialty import

# ---------- Auth / Me ----------
class SpecialtySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Specialty
        fields = ["id", "name_fr", "name_en", "name"]

    def get_name(self, obj):
        request = self.context.get("request")
        lang = "fr"
        if request:
            lang = request.headers.get("Accept-Language", "fr").lower()
        return obj.name_en if lang.startswith("en") else obj.name_fr

class MeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    specialite = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name",
            "role", "full_name", "langue", "theme",
            "telephone", "specialite", "departement",
            "licence_medicale", "date_adhesion", "poste",
            "photo", "photo_url", "is_active",
            "notifications",
        )

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_role(self, obj):
        return (obj.role or "").upper()

    def get_photo_url(self, obj):
        request = self.context.get("request")
        if obj.photo and hasattr(obj.photo, "url"):
            return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
        return None

    def get_specialite(self, obj):
        if not obj.specialite:
            return None

        request = self.context.get("request")
        lang = "fr"
        if request:
            lang = request.headers.get("Accept-Language", "fr").lower()

        spec = obj.specialite
        return {
            "id": spec.id,
            "name": spec.name_en if lang.startswith("en") else spec.name_fr,
            "name_fr": spec.name_fr,
            "name_en": spec.name_en,
        }


# ---------- Token (Login) ----------
class TokenObtainWithRoleSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(required=False, allow_blank=True)
    code_personnel = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(required=True)

    def validate(self, attrs):
        username = attrs.get("username", "").strip()
        password = attrs.get("password", "")
        code_personnel = attrs.get("code_personnel", "")
        role = (attrs.get("role") or "").lower()

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError("Utilisateur introuvable.")

        if user.role != role:
            raise serializers.ValidationError("Rôle incorrect pour cet utilisateur.")

        if role == "medecin":
            if not code_personnel or code_personnel != user.code_personnel:
                raise serializers.ValidationError("Code personnel requis ou invalide.")
        else:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("Identifiants invalides.")

        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "role": (user.role or "").upper(),
            "username": user.username,
        }


# ---------- Users CRUD ----------
# ---------- Users CRUD ----------
class UserListSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    specialite = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name",
            "role", "full_name", "specialite", "departement", "photo"
        )

    def get_role(self, obj):
        return (obj.role or "").upper()

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_specialite(self, obj):
        if not obj.specialite:
            return None

        request = self.context.get("request")
        lang = "fr"
        if request:
            lang = request.headers.get("Accept-Language", "fr").lower()

        spec = obj.specialite
        return {
            "id": spec.id,
            "name": spec.name_en if lang.startswith("en") else spec.name_fr,
            "name_fr": spec.name_fr,
            "name_en": spec.name_en,
        }



class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.CharField()

    class Meta:
        model = User
        fields = (
            "username", "email", "first_name", "last_name",
            "role", "code_personnel",
            "departement", "specialite_fr", "specialite_en",
            "password",
        )

    def validate(self, attrs):
        role = (attrs.get("role") or "").lower()
        attrs["role"] = role

        if role == "medecin":
            if not attrs.get("code_personnel"):
                raise serializers.ValidationError({"code_personnel": "Obligatoire pour un médecin."})
            attrs["password"] = None
        elif role in {"secretaire", "direction"}:
            pwd = attrs.get("password")
            if not pwd:
                raise serializers.ValidationError({"password": "Mot de passe requis pour ce rôle."})
            attrs["code_personnel"] = None
        else:
            raise serializers.ValidationError({"role": "Rôle invalide."})
        return attrs

    def create(self, validated):
        password = validated.pop("password", None)
        user = User(**validated)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "email", "first_name", "last_name",
            "telephone", "specialite_fr", "specialite_en", "departement",
            "licence_medicale", "date_adhesion", "poste",
            "langue", "theme", "notifications", "is_active",
        )


# ---------- Lookups (Médecins pour calendrier / notifs) ----------
class PhysicianLookupSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    specialite = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "first_name", "last_name",
            "full_name", "specialite", "departement", "photo"
        )

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_specialite(self, obj):
        if not obj.specialite:
            return None

        request = self.context.get("request")
        lang = "fr"
        if request:
            lang = request.headers.get("Accept-Language", "fr").lower()

        spec = obj.specialite
        return {
            "id": spec.id,
            "name": spec.name_en if lang.startswith("en") else spec.name_fr,
            "name_fr": spec.name_fr,
            "name_en": spec.name_en,
        }


# ---------- Upload photo ----------
class PhotoUploadSerializer(serializers.Serializer):
    photo = serializers.ImageField()