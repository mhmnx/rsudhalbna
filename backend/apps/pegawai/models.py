# apps/pegawai/models.py
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

# Manager kustom kita tetap sama, tidak perlu diubah
class PegawaiManager(BaseUserManager):
    
    def create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError(_('Email harus diisi'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser harus memiliki is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser harus memiliki is_superuser=True.'))
        return self.create_user(email, password, **extra_fields)

# Definisikan model master terlebih dahulu
class Bidang(models.Model):
    nama_bidang = models.CharField(max_length=150, unique=True)

    def __str__(self):
        return self.nama_bidang

class UnitKerja(models.Model):
    nama_unit = models.CharField(max_length=150, unique=True)
    bidang = models.ForeignKey(Bidang, on_delete=models.PROTECT, related_name='unit_kerja_list')

    def __str__(self):
        return self.nama_unit


class Jabatan(models.Model):
    nama_jabatan = models.CharField(max_length=150, unique=True)
    deskripsi = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nama_jabatan

# Model Pegawai yang sudah dilengkapi
class Pegawai(AbstractUser):
    
    class Role(models.TextChoices):
        PEGAWAI = 'PEGAWAI', _('Pegawai')
        ATASAN = 'ATASAN', _('Atasan')
        ADMIN = 'ADMIN', _('Admin')
        
    username = None # Kita tidak menggunakan username
    email = models.EmailField(_('alamat email'), unique=True)
    
    # Field dari referensi Anda
    nip = models.CharField(max_length=30, unique=True)
    nama_lengkap = models.CharField(max_length=255)
    gelar_depan = models.CharField(max_length=20, blank=True, null=True)
    gelar_belakang = models.CharField(max_length=20, blank=True, null=True)
    tempat_lahir = models.CharField(max_length=100, blank=True, null=True)
    tanggal_lahir = models.DateField(blank=True, null=True)
    jenis_kelamin = models.CharField(max_length=20, blank=True, null=True)
    pangkat_gol_ruang = models.CharField(max_length=50, blank=True, null=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.PEGAWAI)
    jabatan = models.ForeignKey(Jabatan, on_delete=models.SET_NULL, null=True, blank=True, related_name='pegawai_list')
    nik = models.CharField(max_length=16, blank=True, null=True)
    penempatan_awal = models.CharField(max_length=255, blank=True, null=True)
    jenis_pegawai = models.CharField(max_length=50, blank=True, null=True) # Contoh: PNS, BLUD, THL
    status_kepegawaian = models.CharField(max_length=50, default='Aktif', blank=True, null=True) # Contoh: Aktif, Cuti, Pensiun
    status_perkawinan = models.CharField(max_length=50, blank=True, null=True) # Contoh: Kawin, Belum Kawin
    pendidikan_terakhir = models.CharField(max_length=50, blank=True, null=True) # Contoh: S1, S2
    alamat = models.TextField(blank=True, null=True)

    # Relasi
    unit_kerja = models.ForeignKey('UnitKerja', on_delete=models.SET_NULL, null=True, blank=True, related_name='anggota_list')
    atasan_langsung = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='bawahan_list')
    
    objects = PegawaiManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nama_lengkap', 'nip']

    def __str__(self):
        return self.nama_lengkap

# Menambahkan relasi Kepala Bidang dan Kepala Unit
Bidang.add_to_class('kepala_bidang', models.ForeignKey(Pegawai, on_delete=models.SET_NULL, null=True, blank=True, related_name='kepala_dari_bidang'))
UnitKerja.add_to_class('kepala_unit', models.ForeignKey(Pegawai, on_delete=models.SET_NULL, null=True, blank=True, related_name='kepala_dari_unit'))