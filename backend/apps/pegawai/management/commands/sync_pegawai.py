# apps/pegawai/management/commands/sync_pegawai.py

import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.pegawai.models import Pegawai, UnitKerja, Bidang, Jabatan

EXTERNAL_API_URL = settings.EXTERNAL_API_BASE_URL

class Command(BaseCommand):
    help = 'Sinkronisasi data pegawai dari API eksternal, dengan NIP sebagai password default untuk user baru.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS(f"Mengambil data dari API percobaan: {EXTERNAL_API_URL}"))

        # Siapkan Bidang Default untuk unit kerja baru
        default_bidang, _ = Bidang.objects.get_or_create(nama_bidang='Belum Diatur')

        try:
            # Lakukan request GET ke API eksternal
            response = requests.get(EXTERNAL_API_URL)
            # Lemparkan error jika request tidak sukses (status code bukan 2xx)
            response.raise_for_status()
            # Ubah respons menjadi format JSON
            data_dari_api = response.json()

        except requests.exceptions.RequestException as e:
            self.stderr.write(self.style.ERROR(f'Gagal mengambil data dari API eksternal: {e}'))
            return

        created_pegawai_count = 0
        updated_pegawai_count = 0
        created_unit_kerja_count = 0

        for data_pegawai in data_pegawai_eksternal:
            nip_eksternal = data_pegawai.get('nomor_induk_pegawai')
            if not nip_eksternal:
                continue

            unit_kerja_obj = None
            nama_unit_kerja = data_pegawai.get('nama_unit_kerja')
            if nama_unit_kerja:
                unit_kerja_obj, created = UnitKerja.objects.get_or_create(
                    nama_unit__iexact=nama_unit_kerja.strip(),
                    defaults={'nama_unit': nama_unit_kerja.strip(), 'bidang': default_bidang}
                )
                if created: created_unit_kerja_count += 1

            jabatan_obj = None
            nama_jabatan = data_pegawai.get('nama_jabatan')
            if nama_jabatan:
                jabatan_obj, _ = Jabatan.objects.get_or_create(
                    nama_jabatan__iexact=nama_jabatan.strip(),
                    defaults={'nama_jabatan': nama_jabatan.strip()}
                )

            email_pegawai = data_pegawai.get('email', f"{nip_eksternal}@rsud.banjarnegarakab.go.id")

            pegawai_obj, created = Pegawai.objects.update_or_create(
                nip=nip_eksternal,
                defaults={
                    'nama_lengkap': data_pegawai.get('nama_lengkap', ''),
                    'email': email_pegawai,
                    'pangkat_gol_ruang': data_pegawai.get('pangkat', ''),
                    'unit_kerja': unit_kerja_obj,
                    'jabatan': jabatan_obj,
                }
            )

            if created:
                # --- PERBAIKAN UTAMA DI SINI ---
                # Atur password user baru menggunakan NIP mereka.
                pegawai_obj.set_password(nip_eksternal)
                pegawai_obj.save()
                created_pegawai_count += 1
            else:
                updated_pegawai_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Sinkronisasi selesai! {created_pegawai_count} pegawai baru dibuat, '
            f'{updated_pegawai_count} pegawai diperbarui, '
            f'dan {created_unit_kerja_count} unit kerja baru dibuat.'
        ))