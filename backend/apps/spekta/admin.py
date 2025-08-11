# apps/spekta/admin.py
from django.contrib import admin
from .models import SKP, RencanaHasilKerja, IndikatorKinerja, MasterPerilakuKerja, PeriodePenilaian

class RencanaHasilKerjaInline(admin.TabularInline):
    """Memungkinkan edit RHK langsung dari halaman SKP."""
    model = RencanaHasilKerja
    extra = 1 # Jumlah form kosong yang ditampilkan

@admin.register(SKP)
class SKPAdmin(admin.ModelAdmin):
    # Tambahkan 'atasan_pejabat_penilai' di sini
    list_display = ('__str__', 'status', 'pejabat_penilai', 'atasan_pejabat_penilai', 'periode_awal')
    list_filter = ('status', 'pegawai__unit_kerja')
    search_fields = ('pegawai__nama_lengkap', 'pegawai__nip')
    inlines = [RencanaHasilKerjaInline]

@admin.register(RencanaHasilKerja)
class RencanaHasilKerjaAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'skp')
    search_fields = ('deskripsi',)

@admin.register(IndikatorKinerja)
class IndikatorKinerjaAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'rhk', 'target')
    search_fields = ('deskripsi',)

@admin.register(MasterPerilakuKerja)
class MasterPerilakuKerjaAdmin(admin.ModelAdmin):
    list_display = ('jenis_perilaku', 'uraian_perilaku')
    search_fields = ('jenis_perilaku',)
    list_filter = ('jenis_perilaku',)
    
@admin.register(PeriodePenilaian)
class PeriodePenilaianAdmin(admin.ModelAdmin):
    # Tambahkan 'force_unlocked' ke dalam list_display
    list_display = ('nama_periode', 'skp', 'force_unlocked')
    list_filter = ('skp__pegawai__unit_kerja',)
    list_editable = ('force_unlocked',)