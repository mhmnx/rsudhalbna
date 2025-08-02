# apps/spekta/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SKPViewSet, RencanaHasilKerjaViewSet, IndikatorKinerjaViewSet, PersetujuanViewSet
from .views import PeriodePenilaianViewSet, EvaluasiAksiViewSet, PerilakuKerjaViewSet
from .views import MasterPerilakuKerjaViewSet, RencanaAksiViewSet, BuktiDukungViewSet
from .views import PenilaianListViewSet, LampiranViewSet, EvaluasiPerilakuViewSet, PegawaiDashboardView


# Buat router dan daftarkan viewsets kita

router = DefaultRouter()
router.register(r'skp', SKPViewSet, basename='skp')
router.register(r'rhk', RencanaHasilKerjaViewSet, basename='rhk')
router.register(r'indikator', IndikatorKinerjaViewSet, basename='indikator')
router.register(r'persetujuan', PersetujuanViewSet, basename='persetujuan')
router.register(r'periode-penilaian', PeriodePenilaianViewSet, basename='periodepenilaian')
router.register(r'evaluasi-aksi', EvaluasiAksiViewSet, basename='evaluasiaksi')
router.register(r'perilaku-kerja', PerilakuKerjaViewSet, basename='perilakukerja')
router.register(r'master-perilaku', MasterPerilakuKerjaViewSet, basename='masterperilaku')
router.register(r'rencana-aksi', RencanaAksiViewSet, basename='rencanaaksi')
router.register(r'bukti-dukung', BuktiDukungViewSet, basename='buktidukung')
router.register(r'penilaian-list', PenilaianListViewSet, basename='penilaianlist')
router.register(r'lampiran', LampiranViewSet, basename='lampiran')
router.register(r'evaluasi-perilaku', EvaluasiPerilakuViewSet, basename='evaluasiperilaku')


urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-data/', PegawaiDashboardView.as_view(), name='pegawai-dashboard'),

]