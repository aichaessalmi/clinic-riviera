from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, RefreshView, MeView, MeUpdateView,
    PhysicianListView, UserViewSet, SpecialtyViewSet
)

# ✅ Crée le router et enregistre toutes les routes ici
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'specialties', SpecialtyViewSet, basename='specialty')  # 👈 déplace cette ligne ici

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("me/update/", MeUpdateView.as_view(), name="me-update"),
    path("physicians/", PhysicianListView.as_view(), name="physicians"),
    path("", include(router.urls)),  # ✅ inclut maintenant les specialties aussi
]
