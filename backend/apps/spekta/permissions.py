# apps/spekta/permissions.py
from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Hak akses kustom yang hanya mengizinkan user dengan role 'ADMIN'.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'