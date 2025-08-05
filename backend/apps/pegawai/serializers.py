# apps/pegawai/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import Pegawai, UnitKerja, Bidang, Jabatan


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Tambahkan data kustom ke dalam token
        token['nama_lengkap'] = user.nama_lengkap
        token['nip'] = user.nip
        token['email'] = user.email
        token['role'] = user.role

        return token


class BidangSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bidang
        fields = '__all__'

class UnitKerjaSerializer(serializers.ModelSerializer):
    # Tampilkan nama bidang, bukan hanya ID
    bidang = serializers.StringRelatedField() 

    class Meta:
        model = UnitKerja
        fields = '__all__'

class JabatanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Jabatan
        fields = '__all__'
class UnitKerjaSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitKerja
        fields = ['id', 'nama_unit']

class JabatanSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Jabatan
        fields = ['id', 'nama_jabatan']
        
class PegawaiSerializer(serializers.ModelSerializer):
    unit_kerja = UnitKerjaSimpleSerializer(read_only=True)
    jabatan = JabatanSimpleSerializer(read_only=True)
    atasan_langsung = serializers.StringRelatedField(read_only=True)
    nama_lengkap_gelar = serializers.SerializerMethodField()
    
    # Field ini yang menyebabkan masalah
    jabatan_nama = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Pegawai
        # PERBAIKAN: Tambahkan 'jabatan_nama' ke dalam daftar fields
        fields = [
            'id', 'nip', 'nama_lengkap', 'gelar_depan', 'gelar_belakang',
            'pangkat_gol_ruang', 'unit_kerja', 'jabatan', 'atasan_langsung',
            'role', 'nama_lengkap_gelar', 'nik', 'penempatan_awal', 'jenis_pegawai',
            'status_kepegawaian', 'status_perkawinan', 'pendidikan_terakhir', 'alamat',
            'jabatan_nama' # <-- PASTIKAN FIELD INI DITAMBAHKAN
        ]
        # Jika menggunakan 'fields', 'exclude' tidak diperlukan. Mari kita gunakan fields.
    def get_nama_lengkap_gelar(self, obj):
        """
        Menggabungkan gelar depan, nama lengkap, dan gelar belakang.
        """
        parts = []
        if obj.gelar_depan:
            parts.append(obj.gelar_depan)
        
        parts.append(obj.nama_lengkap)

        if obj.gelar_belakang:
            # Tambahkan koma sebelum gelar belakang jika ada nama
            parts.append(f", {obj.gelar_belakang}")
        
        return " ".join(parts)

    def _get_or_create_jabatan(self, jabatan_nama):
        # Fungsi helper untuk mencari atau membuat jabatan baru
        if jabatan_nama:
            # .strip() untuk menghapus spasi di awal/akhir
            # .get_or_create() akan membuat objek baru jika belum ada
            jabatan, created = Jabatan.objects.get_or_create(
                nama_jabatan__iexact=jabatan_nama.strip(),
                defaults={'nama_jabatan': jabatan_nama.strip()}
            )
            return jabatan
        return None

    def create(self, validated_data):
        # Ambil nama jabatan dari data yang divalidasi
        jabatan_nama = validated_data.pop('jabatan_nama', None)
        jabatan_obj = self._get_or_create_jabatan(jabatan_nama)

        # Buat objek pegawai dengan jabatan yang sudah diproses
        pegawai = Pegawai.objects.create(jabatan=jabatan_obj, **validated_data)
        return pegawai

    def update(self, instance, validated_data):
        # Ambil nama jabatan jika dikirim saat update
        jabatan_nama = validated_data.pop('jabatan_nama', None)
        if jabatan_nama is not None:
            instance.jabatan = self._get_or_create_jabatan(jabatan_nama)

        # Lanjutkan proses update untuk field lainnya
        return super().update(instance, validated_data)

class PublicPegawaiSerializer(serializers.ModelSerializer):
    """
    Serializer khusus untuk API publik pegawai.
    - Tidak menyertakan ID pegawai.
    - Meratakan data unit kerja dan jabatan.
    """
    # Ambil nama dari relasi dan beri nama field 'nama_unit_kerja'
    nama_unit_kerja = serializers.CharField(source='unit_kerja.nama_unit', read_only=True)
    # Ambil nama dari relasi dan beri nama field 'nama_jabatan'
    nama_jabatan = serializers.CharField(source='jabatan.nama_jabatan', read_only=True)
    
    # Field kustom untuk nama lengkap dengan gelar
    nama_lengkap_gelar = serializers.SerializerMethodField()

    class Meta:
        model = Pegawai
        # Definisikan field yang ingin ditampilkan, tanpa 'id'
        fields = [
            'nip',
            'nama_lengkap',
            'nama_lengkap_gelar',
            'gelar_depan',
            'gelar_belakang',
            'pangkat_gol_ruang',
            'nama_unit_kerja', # Field baru yang sudah diratakan
            'nama_jabatan',    # Field baru yang sudah diratakan
            'nik',
            'penempatan_awal',
            'jenis_pegawai',
            'status_kepegawaian',
            'status_perkawinan',
            'pendidikan_terakhir',
            'alamat'
        ]
    
    def get_nama_lengkap_gelar(self, obj):
        # ... (logika get_nama_lengkap_gelar tidak berubah)
        parts = []
        if obj.gelar_depan:
            parts.append(obj.gelar_depan)
        parts.append(obj.nama_lengkap)
        if obj.gelar_belakang:
            parts.append(f", {obj.gelar_belakang}")
        return " ".join(parts)
