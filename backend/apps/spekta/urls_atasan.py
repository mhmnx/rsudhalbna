# apps/spekta/urls_atasan.py
from django.urls import path
from .views import AtasanDashboardView

urlpatterns = [
    path('dashboard-data/', AtasanDashboardView.as_view(), name='atasan-dashboard'),
]