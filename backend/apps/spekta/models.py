# apps/spekta/models.py
from django.db import models
from apps.pegawai.models import Pegawai # Mengimpor model dari aplikasi pegawai
from apps.pegawai.models import Jabatan, UnitKerja

class SKP(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Diajukan', 'Diajukan'),
        ('Persetujuan', 'Persetujuan'),
        ('Ditolak', 'Ditolak'),
    ]
    
    # Relasi ke pemilik SKP dan penilai
    pegawai = models.ForeignKey(Pegawai, on_delete=models.CASCADE, related_name='skp_list')
    pejabat_penilai = models.ForeignKey(Pegawai, on_delete=models.PROTECT, related_name='skp_dinilai', help_text="Atasan langsung pegawai")
    atasan_pejabat_penilai = models.ForeignKey(
        Pegawai, 
        on_delete=models.PROTECT, 
        related_name='skp_diawasi',
        null=True, # Izinkan kosong
        blank=True,
        help_text="Atasan dari pejabat penilai"
    )
    
    # Informasi Periode
    periode_awal = models.DateField()
    periode_akhir = models.DateField()
    
    # Status untuk alur kerja
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    pendekatan = models.CharField(max_length=50, default='Kuantitatif')
    
    # Status untuk alur kerja
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    catatan_penolakan = models.TextField(blank=True, null=True, help_text="Diisi oleh atasan saat SKP ditolak.")
    
    def __str__(self):
        return f"SKP {self.pegawai.nama_lengkap} ({self.periode_awal.year})"

class RencanaHasilKerja(models.Model):
    class Jenis(models.TextChoices):
        UTAMA = 'Utama', 'Utama'
        TAMBAHAN = 'Tambahan', 'Tambahan'

    skp = models.ForeignKey(SKP, on_delete=models.CASCADE, related_name='rhk_list')
    deskripsi = models.TextField()
    intervensi_atasan_text = models.TextField(blank=True, null=True, help_text="RHK pimpinan yang diintervensi")
    aspek = models.CharField(max_length=50, default='Kuantitas')
    # TAMBAHKAN FIELD INI
    jenis_rhk = models.CharField(max_length=10, choices=Jenis.choices, default=Jenis.UTAMA)

    def __str__(self):
        return self.deskripsi[:50]
class IndikatorKinerja(models.Model):
    rhk = models.ForeignKey(RencanaHasilKerja, on_delete=models.CASCADE, related_name='indikator_list')
    deskripsi = models.TextField()
    target = models.CharField(max_length=255)

    def __str__(self):
        return self.deskripsi[:50]
    
# apps/spekta/models.py (tambahan)

class MasterPerilakuKerja(models.Model):
    jenis_perilaku = models.CharField(max_length=255, unique=True)
    uraian_perilaku = models.TextField()

    def __str__(self):
        return self.jenis_perilaku

class PerilakuKerja(models.Model):
    skp = models.ForeignKey(SKP, on_delete=models.CASCADE, related_name='perilaku_kerja_list')
    master_perilaku = models.ForeignKey(MasterPerilakuKerja, on_delete=models.PROTECT)
    ekspektasi_khusus = models.TextField(blank=True, null=True, help_text="Diisi oleh pimpinan saat persetujuan.")

    class Meta:
        # Pastikan satu jenis perilaku hanya ada sekali per SKP
        unique_together = ('skp', 'master_perilaku')

    def __str__(self):
        return f"{self.master_perilaku.jenis_perilaku} untuk SKP {self.skp.id}"

class PeriodePenilaian(models.Model):
    """
    Menyimpan periode bulanan/triwulanan di dalam satu SKP, beserta hasil akhirnya.
    """
    skp = models.ForeignKey(SKP, on_delete=models.CASCADE, related_name='periode_penilaian_list')
    nama_periode = models.CharField(max_length=100, help_text="Contoh: Januari, Triwulan I")
    tanggal_awal = models.DateField()
    tanggal_akhir = models.DateField()

    # Diisi oleh atasan di akhir periode
    rating_hasil_kerja = models.CharField(max_length=50, blank=True, null=True, help_text="Contoh: Sesuai Ekspektasi")
    rating_perilaku_kerja = models.CharField(max_length=50, blank=True, null=True)
    predikat_kinerja = models.CharField(max_length=50, blank=True, null=True, help_text="Contoh: Baik")

    capaian_organisasi = models.CharField(max_length=100, blank=True, null=True)
    catatan_rekomendasi = models.TextField(blank=True, null=True)

    force_unlocked = models.BooleanField(default=False, help_text="Buka kunci penilaian manual oleh Superadmin")

    penilai_saat_itu = models.ForeignKey(
        Pegawai,
        on_delete=models.SET_NULL, # Jika penilai dihapus, datanya tidak hilang
        null=True,
        blank=True,
        related_name='periode_dinilai_list',
        help_text="Snapshot penilai pada saat periode ini dievaluasi"
    )
    jabatan_saat_itu = models.ForeignKey(
        Jabatan,
        on_delete=models.SET_NULL, # Jika master jabatan dihapus, histori tidak hilang
        null=True, blank=True,
        help_text="Snapshot jabatan pegawai pada periode ini"
    )
    unit_kerja_saat_itu = models.ForeignKey(
        UnitKerja,
        on_delete=models.SET_NULL, # Jika master unit kerja dihapus, histori tidak hilang
        null=True, blank=True,
        help_text="Snapshot unit kerja pegawai pada periode ini"
    )


    def __str__(self):
        return f"{self.nama_periode} ({self.skp})"
class EvaluasiAksi(models.Model):
    """
    Menyimpan evaluasi spesifik untuk sebuah Rencana Aksi dalam satu periode.
    """
    periode = models.ForeignKey(PeriodePenilaian, on_delete=models.CASCADE, related_name='evaluasi_aksi_list')
    rencana_aksi = models.ForeignKey('RencanaAksi', on_delete=models.CASCADE, related_name='evaluasi_list')

    realisasi = models.TextField(blank=True, null=True, help_text="Diisi oleh Pegawai")
    dasar_realisasi = models.TextField(blank=True, null=True, help_text="Dasar dari realisasi")

    feedback_atasan = models.TextField(blank=True, null=True, help_text="Diisi oleh Atasan")

    class Meta:
        unique_together = ('periode', 'rencana_aksi')

class BuktiDukung(models.Model):
    evaluasi_aksi = models.ForeignKey(EvaluasiAksi, on_delete=models.CASCADE, related_name='bukti_dukung_list')
    link_bukti = models.CharField(max_length=512) # <-- Gunakan CharField yang lebih fleksibel
    deskripsi = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.link_bukti

# Kita juga perlu model untuk evaluasi perilaku kerja per periode
class EvaluasiPerilaku(models.Model):
    periode = models.ForeignKey(PeriodePenilaian, on_delete=models.CASCADE, related_name='evaluasi_perilaku_list')
    perilaku_kerja = models.ForeignKey(PerilakuKerja, on_delete=models.CASCADE, related_name='evaluasi_list')
    feedback_atasan = models.TextField(blank=True, null=True, help_text="Diisi oleh Atasan")

    class Meta:
        unique_together = ('periode', 'perilaku_kerja')

# Kita tambahkan RencanaAksi di sini agar tidak ada circular import
class RencanaAksi(models.Model):
    rhk = models.ForeignKey(RencanaHasilKerja, on_delete=models.CASCADE, related_name='aksi_list')
    periode = models.ForeignKey(
        PeriodePenilaian, 
        on_delete=models.CASCADE, 
        related_name='rencana_aksi_list',
        null=True # Izinkan null untuk sementara
    )
    deskripsi = models.TextField()
    # TAMBAHKAN FIELD INI
    target = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.deskripsi[:50]

class Lampiran(models.Model):
    # OneToOneField memastikan setiap SKP hanya bisa punya satu lampiran
    skp = models.OneToOneField(SKP, on_delete=models.CASCADE, related_name='lampiran')

    dukungan_sumber_daya = models.TextField(blank=True, null=True)
    skema_pertanggungjawaban = models.TextField(blank=True, null=True)
    konsekuensi = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Lampiran untuk SKP {self.skp.id}"