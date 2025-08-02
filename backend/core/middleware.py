# core/middleware.py
import logging

# Dapatkan logger yang sudah kita definisikan di settings.py
pegawai_logger = logging.getLogger('apps.pegawai')
spekta_logger = logging.getLogger('apps.spekta')

class APILoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Biarkan request diproses oleh view terlebih dahulu
        response = self.get_response(request)

        # Cek jika path request adalah untuk API kita
        path = request.path_info

        if path.startswith('/api/v1/'):
            user = request.user
            method = request.method
            status_code = response.status_code

            log_message = f'"{method} {path}" {status_code} - User: {user.nip if user.is_authenticated else "Anonymous"}'

            # Pilih logger yang tepat berdasarkan path
            if path.startswith('/api/v1/pegawai/'):
                pegawai_logger.info(log_message)
            elif path.startswith('/api/v1/kinerja/'):
                spekta_logger.info(log_message)
            elif path.startswith('/api/v1/admin/'):
                # Log admin bisa dimasukkan ke salah satu atau dibuatkan baru
                spekta_logger.info(f"ADMIN ACTION: {log_message}")

        return response