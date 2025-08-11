# apps/pegawai/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PegawaiViewSet, UnitKerjaViewSet, BidangViewSet, JabatanViewSet

# Buat router dan daftarkan viewsets kita
router = DefaultRouter()
router.register(r'pegawai', PegawaiViewSet, basename='pegawai')
router.register(r'unit-kerja', UnitKerjaViewSet, basename='unitkerja')
router.register(r'bidang', BidangViewSet, basename='bidang')
router.register(r'jabatan', JabatanViewSet, basename='jabatan')

# URL API akan ditentukan secara otomatis oleh router
urlpatterns = [
    path('', include(router.urls)),
]