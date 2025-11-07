# accounts/views.py
from django.utils.text import slugify
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from .models import User
from .serializers import (
    TokenObtainWithRoleSerializer,
    MeSerializer,
    UserListSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    PhysicianLookupSerializer,
    PhotoUploadSerializer,
)
from .permissions import IsDirection, IsDirectionOrSecretaire, IsMedecin
from .models import User, Specialty
from .serializers import (
    TokenObtainWithRoleSerializer, MeSerializer, UserListSerializer,
    UserCreateSerializer, UserUpdateSerializer, PhysicianLookupSerializer,
    PhotoUploadSerializer, SpecialtySerializer
)

from rest_framework import viewsets, permissions

class SpecialtyViewSet(viewsets.ModelViewSet):
    queryset = Specialty.objects.filter(is_active=True).order_by("name_fr")
    serializer_class = SpecialtySerializer
    permission_classes = [permissions.IsAuthenticated]
# ---------- Auth ----------
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = TokenObtainWithRoleSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        return Response(ser.validated_data, status=200)

class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]

# ---------- Me ----------
class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
# ---------- Me Update ----------
from rest_framework import parsers

from django.contrib.auth import update_session_auth_hash

class MeUpdateView(generics.UpdateAPIView):
    """
    Permet à l'utilisateur connecté de modifier son profil (texte + photo)
    ou de changer son mot de passe.
    """
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        data = request.data

        # ✅ 1. Gestion du changement de mot de passe
        if "old_password" in data and "new_password" in data:
            old_pw = data.get("old_password")
            new_pw = data.get("new_password")

            if not user.check_password(old_pw):
                return Response({"detail": "Ancien mot de passe incorrect."},
                                status=status.HTTP_400_BAD_REQUEST)

            if len(new_pw) < 8:
                return Response({"detail": "Le mot de passe doit contenir au moins 8 caractères."},
                                status=status.HTTP_400_BAD_REQUEST)

            user.set_password(new_pw)
            user.save()
            update_session_auth_hash(request, user)
            return Response({"detail": "Mot de passe mis à jour avec succès."},
                            status=status.HTTP_200_OK)

        # ✅ 2. Mise à jour texte/photo
        serializer = self.get_serializer(user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

# ---------- Physicians lookup ----------
class PhysicianListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PhysicianLookupSerializer

    def get_queryset(self):
        qs = User.objects.filter(role="medecin").order_by("last_name", "first_name")
        if self.request.user.role == "medecin":
            qs = qs.filter(id=self.request.user.id)
        return qs.select_related("specialite").only(
    "id",
    "first_name",
    "last_name",
    "email",
    "departement",
    "specialite__name_fr",
    "specialite__name_en",
)


# ---------- Users CRUD ----------
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("last_name", "first_name")
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in {"update", "partial_update"}:
            return UserUpdateSerializer
        return UserListSerializer

    def get_permissions(self):
        # Direction peut tout faire
        if self.action in {"create", "destroy"}:
            return [IsDirection()]
        if self.action in {"update", "partial_update"}:
            # Direction peut modifier tout le monde / Secrétaire peut modifier basiques ?
            return [IsDirectionOrSecretaire()]
        # List/Retrieve: Direction & Secrétaire: OK, Médecin: ne voit que lui-même
        return [permissions.IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        if request.user.role == "medecin":
            qs = qs.filter(id=request.user.id)
        return Response(UserListSerializer(qs, many=True).data)

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        if request.user.role == "medecin" and obj.id != request.user.id:
            return Response({"detail": "Accès refusé."}, status=403)
        return Response(UserListSerializer(obj).data)

    def perform_create(self, serializer):
        # Auto-username si non fourni (prenom.nom unique)
        username = serializer.validated_data.get("username")
        if not username:
            fn = serializer.validated_data.get("first_name", "").strip()
            ln = serializer.validated_data.get("last_name", "").strip()
            base = slugify(f"{fn}.{ln}") or "user"
            username = base
            i = 1
            while User.objects.filter(username=username).exists():
                i += 1
                username = f"{base}{i}"
            serializer.validated_data["username"] = username
        serializer.save()

    # /users/{id}/photo/
    @action(detail=True, methods=["post"])
    def photo(self, request, pk=None):
        user = self.get_object()
        if request.user.role == "medecin" and user.id != request.user.id:
            return Response({"detail": "Accès refusé."}, status=403)

        ser = PhotoUploadSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user.photo = ser.validated_data["photo"]
        user.save()
        return Response({"detail": "Photo mise à jour.", "photo": user.photo.url if user.photo else None})
