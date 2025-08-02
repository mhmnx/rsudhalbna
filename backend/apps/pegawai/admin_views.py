# apps/pegawai/admin_views.py
from django.contrib import admin, messages
from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.core.management import call_command

def sync_pegawai_view(request):
    """
    View yang menangani halaman konfirmasi dan eksekusi
    perintah sync_pegawai.
    """
    # Dapatkan URL untuk halaman daftar Pegawai
    pegawai_changelist_url = reverse('admin:pegawai_pegawai_changelist')

    # Jika request adalah POST (tombol ditekan)
    if request.method == 'POST':
        try:
            # Panggil management command
            call_command('sync_pegawai')
            # Tampilkan pesan sukses
            messages.success(request, "Proses sinkronisasi data pegawai berhasil dijalankan.")
        except Exception as e:
            # Tampilkan pesan error
            messages.error(request, f"Terjadi error saat sinkronisasi: {e}")

        # Arahkan kembali ke halaman daftar Pegawai
        return HttpResponseRedirect(pegawai_changelist_url)

    # Jika request adalah GET, tampilkan halaman konfirmasi
    context = {
        'title': 'Sinkronisasi Data Pegawai',
        'site_header': admin.site.site_header,
        'site_title': admin.site.site_title,
        'index_path': reverse('admin:index'),
    }
    return render(request, 'admin/pegawai_sync_confirm.html', context)