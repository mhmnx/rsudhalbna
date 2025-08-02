# apps/pegawai/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Pegawai, UnitKerja, Bidang, Jabatan
from .forms import PegawaiCreationForm, PegawaiChangeForm
from django.contrib import admin, messages
from django.urls import path
from django.http import HttpResponseRedirect
from django.core.management import call_command
from .models import Pegawai, UnitKerja, Bidang, Jabatan
from .forms import PegawaiCreationForm, PegawaiChangeForm
import requests
from django.conf import settings
from django.contrib.auth.models import User
from .admin_views import sync_pegawai_view




@admin.register(Pegawai)
class PegawaiAdmin(UserAdmin):
    form = PegawaiChangeForm
    add_form = PegawaiCreationForm

    list_display = ('nip', 'nama_lengkap', 'email', 'jabatan', 'unit_kerja', 'role')
    # Tambahkan 'jabatan' ke list_filter
    list_filter = ('role', 'unit_kerja', 'jabatan') # UBAH BARIS INI

    search_fields = ('nip', 'nama_lengkap', 'email')
    ordering = ('nip',)

    # Pengaturan tampilan di halaman edit/detail pegawai
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informasi Personal', {'fields': (
            'nip', 'nama_lengkap', 'gelar_depan', 'gelar_belakang', 
            # Tambahkan 'jabatan' ke form edit
            'jabatan', 'pangkat_gol_ruang', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin'
        )}),
        ('Struktur & Role Aplikasi', {'fields': ('unit_kerja', 'atasan_langsung', 'role')}),
        ('Tanggal Penting', {'fields': ('last_login', 'date_joined')}),
    )

    # Form tambah pegawai tetap minimalis
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nip', 'nama_lengkap', 'password1', 'password2'),
        }),
    )
    
    # Logika untuk tombol sync
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            # URL baru untuk halaman sinkronisasi
            path('sinkronisasi/', self.admin_site.admin_view(sync_pegawai_view), name='pegawai-sync'),
        ]
        return custom_urls + urls

@admin.register(UnitKerja)
class UnitKerjaAdmin(admin.ModelAdmin):
    list_display = ('nama_unit', 'bidang', 'kepala_unit')
    search_fields = ('nama_unit',)
    list_filter = ('bidang',)

@admin.register(Bidang)
class BidangAdmin(admin.ModelAdmin):
    list_display = ('nama_bidang', 'kepala_bidang')
    search_fields = ('nama_bidang',)
    
@admin.register(Jabatan)
class JabatanAdmin(admin.ModelAdmin):
    list_display = ('nama_jabatan',)
    search_fields = ('nama_jabatan',)
