# apps/pegawai/apps.py (Sesudah)

from django.apps import AppConfig

class PegawaiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.pegawai'

    def ready(self):
        # Impor file signals agar terdaftar saat aplikasi siap
        import apps.pegawai.signals
    