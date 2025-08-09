# apps/pegawai/urls_public.py
from django.urls import path
from .views import PublicPegawaiView

urlpatterns = [
    path('', PublicPegawaiView.as_view(), name='public-pegawai-list'),
    path('<str:nip>/', PublicPegawaiView.as_view(), name='public-pegawai-detail'),
]