# apps/spekta/urls_admin.py
from django.urls import path
from .views import DashboardStatsView
# apps/spekta/urls_admin.py
from .views import  MonitoringPegawaiView # Impor view baru
from .views import DashboardStatsView, MonitoringPegawaiView, ExportMonitoringExcelView # Impor view baru


urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('monitoring/', MonitoringPegawaiView.as_view(), name='monitoring-pegawai'),
    path('monitoring/export/', ExportMonitoringExcelView.as_view(), name='monitoring-export-excel'),

]