from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role")


class TokenObtainWithRoleSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(required=False, allow_blank=True)
    code_personnel = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(required=True)  # rôle obligatoire

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")
        code_personnel = attrs.get("code_personnel")
        role = attrs.get("role").upper()  # 🔼 On met en majuscule

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError("Utilisateur introuvable.")

        # 🚨 Vérifier que le rôle correspond
        if user.role.upper() != role:
            raise serializers.ValidationError("Rôle incorrect pour cet utilisateur.")

        # Cas médecin : login avec code_personnel
        if role == "MEDECIN":
            if not code_personnel or code_personnel != user.code_personnel:
                raise serializers.ValidationError("Code personnel requis ou invalide.")

        # Cas secrétaire / direction : login classique
        else:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("Identifiants invalides.")

        # ✅ Génération du token JWT
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "role": user.role.upper(),
            "username": user.username,
        }
