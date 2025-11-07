# accounts/permissions.py
from rest_framework.permissions import BasePermission

class IsDirection(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "direction")

class IsSecretaire(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "secretaire")

class IsMedecin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "medecin")

class IsDirectionOrSecretaire(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated and
            request.user.role in {"direction", "secretaire"}
        )
