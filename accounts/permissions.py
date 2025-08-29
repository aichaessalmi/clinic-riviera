from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsDirection(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "DIRECTION")

class IsSecretaire(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "SECRETAIRE")

class IsMedecin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "MEDECIN")

class IsDirectionOrSecretaire(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.role.upper() in {"DIRECTION", "SECRETAIRE"}
        )
