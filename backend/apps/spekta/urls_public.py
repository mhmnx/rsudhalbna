# apps/spekta/urls_public.py
from django.urls import path
from .views import KinerjaPegawaiAPIView
from .views import PublicPrintRedirectView

urlpatterns = [
    # URL untuk data tahunan: /kinerja/{nip}/{tahun}/
    path('<str:nip>/<int:year>/', KinerjaPegawaiAPIView.as_view(), name='kinerja-tahunan'),
    # URL untuk data bulanan: /kinerja/{nip}/{tahun}/{bulan}/
    path('<str:nip>/<int:year>/<int:month>/', KinerjaPegawaiAPIView.as_view(), name='kinerja-bulanan'),
    
    path('<str:nip>/<int:year>/<int:month>/printPreview/', PublicPrintRedirectView.as_view(), name='public-print-redirect'),


]