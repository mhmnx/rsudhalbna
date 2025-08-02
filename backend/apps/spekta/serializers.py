# apps/spekta/serializers.py
from rest_framework import serializers
from .models import SKP, RencanaHasilKerja, IndikatorKinerja
from .models import PeriodePenilaian, EvaluasiAksi, BuktiDukung, EvaluasiPerilaku 
from .models import MasterPerilakuKerja, PerilakuKerja, Lampiran, RencanaAksi
import datetime
from apps.pegawai.serializers import PegawaiSerializer, UnitKerjaSerializer, JabatanSerializer
from dateutil.relativedelta import relativedelta
from apps.pegawai.models import Pegawai


RATING_CHOICES = ['Di Atas Ekspektasi', 'Sesuai Ekspektasi', 'Di Bawah Ekspektasi']
PREDIKAT_CHOICES = ['Sangat Baik', 'Baik', 'Butuh Perbaikan', 'Kurang / Misconduct', 'Sangat Kurang']
FEEDBACK_CHOICES = ['Sangat Baik', 'Baik', 'Perlu Perbaikan', 'Kurang', 'Sangat Kurang']



class IndikatorKinerjaSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndikatorKinerja
        fields = '__all__'
        # TAMBAHKAN BARIS INI
        read_only_fields = ('rhk',)

class RencanaHasilKerjaSerializer(serializers.ModelSerializer):
    # Tampilkan indikator yang terhubung dengan RHK ini
    indikator_list = IndikatorKinerjaSerializer(many=True, read_only=True)

    class Meta:
        model = RencanaHasilKerja
        fields = '__all__'

class SKPSerializer(serializers.ModelSerializer):
    # Saat membaca data SKP, tampilkan detail pegawai, bukan hanya ID
    pegawai = PegawaiSerializer(read_only=True)
    # Tampilkan juga daftar RHK yang terhubung
    rhk_list = RencanaHasilKerjaSerializer(many=True, read_only=True)

    class Meta:
        model = SKP
        fields = '__all__'
        # Status hanya bisa dibaca, tidak bisa diubah langsung via API
        read_only_fields = ('status', 'pegawai', 'pejabat_penilai')

class BuktiDukungSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuktiDukung
        fields = '__all__'
        # HAPUS read_only_fields dari sini.
        # Field 'evaluasi_aksi' harus bisa ditulis saat membuat data baru.
        
class EvaluasiAksiSerializer(serializers.ModelSerializer):
    bukti_dukung_list = BuktiDukungSerializer(many=True, read_only=True)
    # Jadikan feedback sebagai ChoiceField
    feedback_atasan = serializers.ChoiceField(choices=FEEDBACK_CHOICES, allow_null=True, required=False)

    class Meta:
        model = EvaluasiAksi
        fields = '__all__'
        read_only_fields = ('periode', 'rencana_aksi')

class PeriodePenilaianSerializer(serializers.ModelSerializer):
    """
    Serializer ini berisi SEMUA logika utama.
    """
    penilai_saat_itu = serializers.StringRelatedField(read_only=True)
    jabatan_saat_itu = serializers.StringRelatedField(read_only=True)
    unit_kerja_saat_itu = serializers.StringRelatedField(read_only=True)
    is_assessment_locked = serializers.SerializerMethodField()
    is_ready_for_assessment = serializers.SerializerMethodField()

    class Meta:
        model = PeriodePenilaian
        fields = '__all__'

    def get_is_assessment_locked(self, obj):
        if obj.force_unlocked:
            return False
        deadline = obj.tanggal_akhir + relativedelta(days=5)
        return datetime.date.today() > deadline
    
    def get_is_ready_for_assessment(self, obj):
        """
        Logika baru yang lebih akurat:
        Hanya memeriksa Rencana Aksi yang terhubung ke periode INI.
        """
        print(f"\n--- DEBUG KESIAPAN PENILAIAN UNTUK PERIODE ID: {obj.id} ---")
        
        # 1. Ambil HANYA Rencana Aksi yang terhubung ke periode INI.
        aksi_di_periode_ini = RencanaAksi.objects.filter(periode=obj)
        
        if not aksi_di_periode_ini.exists():
            print("-> HASIL: False (Tidak ada Rencana Aksi yang dibuat untuk periode ini)")
            print("---------------------------------------------------\n")
            return False
        
        print(f"Ditemukan total {aksi_di_periode_ini.count()} Rencana Aksi di periode ini.")

        # 2. Periksa setiap Rencana Aksi di periode ini satu per satu.
        for aksi in aksi_di_periode_ini:
            print(f"  - Memeriksa Aksi ID: {aksi.id} ('{aksi.deskripsi[:30]}...')")
            try:
                # Dapatkan objek evaluasi (seharusnya selalu ada jika aksi terhubung ke periode)
                evaluasi = aksi.evaluasi_list.get(periode=obj)
                
                realisasi_ada = bool(evaluasi.realisasi and evaluasi.realisasi.strip())
                print(f"    - Realisasi Ditemukan: {realisasi_ada}")

                bukti_ada = evaluasi.bukti_dukung_list.exists()
                print(f"    - Bukti Dukung Ditemukan: {bukti_ada}")

                if not realisasi_ada or not bukti_ada:
                    print(f"-> HASIL: False (Aksi ID {aksi.id} tidak lengkap)")
                    print("---------------------------------------------------\n")
                    return False
            
            except EvaluasiAksi.DoesNotExist:
                print(f"    - Objek EvaluasiAksi TIDAK DITEMUKAN (ini seharusnya tidak terjadi).")
                print(f"-> HASIL: False (Aksi ID {aksi.id} bermasalah)")
                print("---------------------------------------------------\n")
                return False

        print("-> HASIL: True (Semua Rencana Aksi di periode ini sudah lengkap)")
        print("---------------------------------------------------\n")
        return True
        
    def validate(self, data):
        """
        Metode validasi ini akan diwarisi oleh PeriodePenilaianDetailSerializer.
        """
        instance = self.instance
        if not instance:
            return data # Hanya jalankan validasi saat update (PATCH)
        
        skp = instance.skp
        user = self.context['request'].user

        # 1. Validasi: Hanya atasan penilai yang bisa menilai
        if user != skp.pejabat_penilai:
            raise serializers.ValidationError("Anda tidak memiliki izin untuk menilai SKP ini.")

        # 2. Validasi: Cek batas waktu (kecuali dibuka paksa)
        if not instance.force_unlocked:
            deadline = instance.tanggal_akhir + relativedelta(days=5)
            if datetime.date.today() > deadline:
                raise serializers.ValidationError(f"Batas waktu penilaian telah berakhir pada {deadline}.")

        # 3. Validasi: Cek kelengkapan
        semua_aksi = RencanaAksi.objects.filter(rhk__skp=skp)
        if semua_aksi.exists():
            for aksi in semua_aksi:
                try:
                    evaluasi = aksi.evaluasi_list.get(periode=instance)
                    if not evaluasi.realisasi or not evaluasi.bukti_dukung_list.exists():
                        raise serializers.ValidationError(f"Penilaian gagal: Rencana Aksi '{aksi.deskripsi[:30]}...' belum lengkap.")
                except EvaluasiAksi.DoesNotExist:
                    raise serializers.ValidationError(f"Penilaian gagal: Rencana Aksi '{aksi.deskripsi[:30]}...' belum diisi.")
        
        return data

    
class LaporanEvaluasiPerilakuSerializer(serializers.ModelSerializer):
    # Tampilkan deskripsi master perilaku
    master_perilaku_deskripsi = serializers.CharField(source='perilaku_kerja.master_perilaku.jenis_perilaku', read_only=True)
    class Meta:
        model = EvaluasiPerilaku
        fields = ['master_perilaku_deskripsi', 'feedback_atasan']

# Serializer untuk menampilkan evaluasi aksi dalam laporan
class LaporanEvaluasiAksiSerializer(serializers.ModelSerializer):
    rencana_aksi_deskripsi = serializers.CharField(source='rencana_aksi.deskripsi', read_only=True)
    bukti_dukung_list = BuktiDukungSerializer(many=True, read_only=True)
    class Meta:
        model = EvaluasiAksi
        fields = ['rencana_aksi_deskripsi', 'realisasi', 'feedback_atasan', 'bukti_dukung_list']

# Serializer untuk menampilkan periode penilaian dalam laporan
class LaporanPeriodePenilaianSerializer(serializers.ModelSerializer):
    evaluasi_aksi_list = LaporanEvaluasiAksiSerializer(many=True, read_only=True)
    evaluasi_perilaku_list = LaporanEvaluasiPerilakuSerializer(many=True, read_only=True)
    class Meta:
        model = PeriodePenilaian
        fields = [
            'nama_periode', 'tanggal_awal', 'tanggal_akhir', 
            'rating_hasil_kerja', 'rating_perilaku_kerja', 'predikat_kinerja',
            'evaluasi_aksi_list', 'evaluasi_perilaku_list'
        ]

class PeriodePenilaianUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer sederhana yang HANYA digunakan untuk mengupdate data penilaian oleh atasan.
    """
    class Meta:
        model = PeriodePenilaian
        # Definisikan hanya field yang boleh di-update
        fields = [
            'rating_hasil_kerja',
            'rating_perilaku_kerja',
            'predikat_kinerja',
            'capaian_organisasi',
            'catatan_rekomendasi',
        ]

# Serializer untuk menampilkan RHK dalam laporan
class LaporanRHKSerializer(serializers.ModelSerializer):
    indikator_list = IndikatorKinerjaSerializer(many=True, read_only=True)
    class Meta:
        model = RencanaHasilKerja
        fields = ['deskripsi', 'indikator_list']

# Serializer utama untuk Laporan SKP Lengkap
class SKPLaporanSerializer(serializers.ModelSerializer):
    pegawai = PegawaiSerializer(read_only=True)
    pejabat_penilai = PegawaiSerializer(read_only=True)
    rhk_list = LaporanRHKSerializer(many=True, read_only=True)
    periode_penilaian_list = LaporanPeriodePenilaianSerializer(many=True, read_only=True)

    class Meta:
        model = SKP
        fields = [
            'id', 'status', 'periode_awal', 'periode_akhir', 
            'pegawai', 'pejabat_penilai', 
            'rhk_list', 'periode_penilaian_list'
        ]
        
class MasterPerilakuKerjaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterPerilakuKerja
        fields = '__all__'

class PerilakuKerjaSerializer(serializers.ModelSerializer):
    master_perilaku = MasterPerilakuKerjaSerializer(read_only=True)
    # Tambahkan SerializerMethodField untuk evaluasi
    evaluasi = serializers.SerializerMethodField()

    class Meta:
        model = PerilakuKerja
        fields = '__all__' # Pastikan 'evaluasi' disertakan jika fields didefinisikan manual

    def get_evaluasi(self, obj):
        # Logika ini sama seperti di RencanaAksiSerializer
        view = self.context.get('view')
        if view and view.kwargs.get('pk'):
            periode_id = view.kwargs.get('pk')
            evaluasi_obj = obj.evaluasi_list.filter(periode_id=periode_id).first()
            if evaluasi_obj:
                return EvaluasiPerilakuSerializer(evaluasi_obj).data
        return None

class LampiranSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lampiran
        fields = '__all__'


class RencanaAksiSerializer(serializers.ModelSerializer):
    """
    Serializer ini sekarang akan secara cerdas mengambil data evaluasi
    berdasarkan periode yang sedang dilihat di URL.
    """
    evaluasi = serializers.SerializerMethodField()

    class Meta:
        model = RencanaAksi
        fields = ['id', 'rhk', 'deskripsi', 'target', 'evaluasi', 'periode']
    
    def get_evaluasi(self, obj):
        # Ambil 'view' dari context serializer
        view = self.context.get('view')
        if view:
            # Ambil ID periode dari parameter URL (misal: /api/.../periode-penilaian/17/)
            periode_id = view.kwargs.get('pk')
            if periode_id:
                # Cari objek evaluasi yang cocok dengan Rencana Aksi DAN Periode ini
                evaluasi_obj = obj.evaluasi_list.filter(periode_id=periode_id).first()
                if evaluasi_obj:
                    # Jika ditemukan, serialize datanya
                    return EvaluasiAksiSerializer(evaluasi_obj).data
        # Jika tidak ditemukan, kembalikan null
        return None
        
# Serializer RHK yang lebih detail untuk halaman ini
class RHKDetailSerializer(serializers.ModelSerializer):
    indikator_list = IndikatorKinerjaSerializer(many=True)
    # Ubah ini menjadi SerializerMethodField
    aksi_list = serializers.SerializerMethodField()

    class Meta:
        model = RencanaHasilKerja
        fields = ['id', 'skp', 'deskripsi', 'intervensi_atasan_text', 'aspek', 'jenis_rhk', 'indikator_list', 'aksi_list']

    def create(self, validated_data):
        # Metode create Anda sudah benar
        indicators_data = validated_data.pop('indikator_list', [])
        rhk = RencanaHasilKerja.objects.create(**validated_data)
        for indicator_data in indicators_data:
            IndikatorKinerja.objects.create(rhk=rhk, **indicator_data)
        return rhk

    # --- TAMBAHKAN METODE UPDATE DI BAWAH INI ---
    def update(self, instance, validated_data):
        # Ambil data indikator dari payload
        indicators_data = validated_data.pop('indikator_list', [])
        
        # Perbarui field-field dari RHK itu sendiri (deskripsi, aspek, dll.)
        instance.deskripsi = validated_data.get('deskripsi', instance.deskripsi)
        instance.intervensi_atasan_text = validated_data.get('intervensi_atasan_text', instance.intervensi_atasan_text)
        instance.aspek = validated_data.get('aspek', instance.aspek)
        instance.jenis_rhk = validated_data.get('jenis_rhk', instance.jenis_rhk)
        instance.save()

        # Untuk menyederhanakan, kita asumsikan modal hanya mengedit satu indikator.
        # Hapus indikator lama dan buat yang baru. Ini adalah cara paling aman
        # untuk memastikan data sinkron.
        if indicators_data:
            # Hapus semua indikator yang terhubung dengan RHK ini
            instance.indikator_list.all().delete()
            # Buat ulang indikator dengan data baru dari form
            for indicator_data in indicators_data:
                IndikatorKinerja.objects.create(rhk=instance, **indicator_data)

        return instance
    
    def get_aksi_list(self, obj):
        """
        Metode ini secara dinamis memfilter Rencana Aksi berdasarkan
        ID periode yang sedang diakses.
        """
        # Dapatkan 'periode_id' dari context yang dikirim oleh view
        view = self.context.get('view')
        if view and view.kwargs.get('pk'):
            periode_id = view.kwargs.get('pk')
            # Filter aksi_list berdasarkan periode_id
            aksi_queryset = obj.aksi_list.filter(periode_id=periode_id)
            # Serialize queryset yang sudah difilter
            return RencanaAksiSerializer(aksi_queryset, many=True, context=self.context).data
        # Kembalikan list kosong jika tidak ada periode_id (pengaman)
        return []



class SKPDetailSerializer(serializers.ModelSerializer):
    pegawai = PegawaiSerializer(read_only=True)
    pejabat_penilai = PegawaiSerializer(read_only=True)
    atasan_pejabat_penilai = PegawaiSerializer(read_only=True)
    # Gunakan RHKDetailSerializer di sini
    rhk_list = RHKDetailSerializer(many=True, read_only=True)
    perilaku_kerja_list = PerilakuKerjaSerializer(many=True, read_only=True)
    lampiran = LampiranSerializer(read_only=True)
    periode_penilaian_list = PeriodePenilaianSerializer(many=True, read_only=True)


    class Meta:
        model = SKP
        fields = '__all__'

    def to_representation(self, instance):
        """
        Override metode ini untuk meneruskan 'periode_id' dari view ke serializer anak.
        """
        # Dapatkan 'periode_id' dari context yang dikirim oleh view
        periode_id = self.context.get('periode_id')
        # Buat context baru untuk diteruskan ke RHKDetailSerializer
        rhk_context = self.context.copy()
        if periode_id:
            rhk_context['periode_id'] = periode_id
        
        # Render data RHK secara manual dengan context yang baru
        self.fields['rhk_list'] = RHKDetailSerializer(many=True, read_only=True, context=rhk_context)
        return super().to_representation(instance)

class AddPeriodeSerializer(serializers.Serializer):
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2020, max_value=2100)



class PeriodePenilaianDetailSerializer(PeriodePenilaianSerializer):
    """
    Serializer ini tetap sederhana. Ia mewarisi semua field dan metode (termasuk .validate())
    dari PeriodePenilaianSerializer, dan hanya menambahkan data 'skp'.
    """
    skp = SKPDetailSerializer(read_only=True)

    
    
class EvaluasiPerilakuSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluasiPerilaku
        fields = '__all__'
        read_only_fields = ('periode', 'perilaku_kerja')


class RatingSerializer(serializers.Serializer):
    rating_hasil_kerja = serializers.ChoiceField(choices=RATING_CHOICES)
    rating_perilaku_kerja = serializers.ChoiceField(choices=RATING_CHOICES)
    predikat_kinerja = serializers.ChoiceField(choices=PREDIKAT_CHOICES)
    
    
    
    
# apps/spekta/serializers.py

class KinerjaBulananPublicSerializer(serializers.ModelSerializer):
    """
    Serializer untuk menampilkan data penilaian bulanan secara publik.
    """
    class Meta:
        model = PeriodePenilaian
        fields = [
            'nama_periode', 'rating_hasil_kerja', 'rating_perilaku_kerja',
            'predikat_kinerja', 'capaian_organisasi', 'catatan_rekomendasi'
        ]


class KinerjaTahunanPublicSerializer(serializers.ModelSerializer):
    """
    Serializer utama untuk API publik, menampilkan data SKP tahunan
    beserta rincian penilaian bulanannya.
    """
    pegawai = PegawaiSerializer(read_only=True)
    # Menggunakan serializer di atas untuk menampilkan rincian bulanan
    penilaian_bulanan = KinerjaBulananPublicSerializer(
        source='periode_penilaian_list', many=True, read_only=True
    )

    class Meta:
        model = SKP
        fields = [
            'id', 'pegawai', 'periode_awal', 'periode_akhir',
            'pendekatan', 'status', 'penilaian_bulanan'
        ]
        
class AtasanDashboardBawahanSerializer(serializers.ModelSerializer):
    """
    Serializer untuk menampilkan data ringkas bawahan di dashboard atasan.
    """
    nama_lengkap_gelar = serializers.SerializerMethodField()
    skp_aktif_status = serializers.SerializerMethodField()
    skp_aktif_id = serializers.SerializerMethodField()
    periode_dinilai_count = serializers.SerializerMethodField()
    total_periode_count = serializers.SerializerMethodField()
    # TAMBAHKAN FIELD BARU INI
    periode_penilaian_bulan_ini = serializers.SerializerMethodField()

    class Meta:
        model = Pegawai
        # TAMBAHKAN 'periode_penilaian_bulan_ini' KE DALAM FIELDS
        fields = [
            'id', 'nama_lengkap_gelar', 'nip', 'jabatan',
            'skp_aktif_status', 'skp_aktif_id',
            'periode_dinilai_count', 'total_periode_count',
            'periode_penilaian_bulan_ini'
        ]

    # 3. Tambahkan metode untuk mengisi field virtual tersebut
    def get_nama_lengkap_gelar(self, obj):
        """
        Menggabungkan gelar depan, nama lengkap, dan gelar belakang.
        """
        parts = []
        if obj.gelar_depan:
            parts.append(obj.gelar_depan)
        
        parts.append(obj.nama_lengkap)

        if obj.gelar_belakang:
            parts.append(f", {obj.gelar_belakang}")
        
        return " ".join(parts)

    def get_skp_aktif_status(self, obj):
        skp = obj.skp_list.filter(periode_awal__year=datetime.date.today().year).first()
        return skp.get_status_display() if skp else "Belum Dibuat"

    def get_skp_aktif_id(self, obj):
        skp = obj.skp_list.filter(periode_awal__year=datetime.date.today().year).first()
        return skp.id if skp else None

    def get_periode_dinilai_count(self, obj):
        skp = obj.skp_list.filter(periode_awal__year=datetime.date.today().year).first()
        if skp:
            return skp.periode_penilaian_list.filter(predikat_kinerja__isnull=False).exclude(predikat_kinerja='').count()
        return 0

    def get_total_periode_count(self, obj):
        skp = obj.skp_list.filter(periode_awal__year=datetime.date.today().year).first()
        return skp.periode_penilaian_list.count() if skp else 0
    
    def get_periode_penilaian_bulan_ini(self, obj):
        """
        Mencari periode penilaian untuk bulan ini dan mengembalikan rentang tanggalnya.
        """
        today = datetime.date.today()
        skp = obj.skp_list.filter(periode_awal__year=today.year).first()
        if not skp:
            return "SKP Belum Dibuat"

        try:
            periode = skp.periode_penilaian_list.get(
                tanggal_awal__month=today.month,
                tanggal_awal__year=today.year
            )
            # Hitung deadline (tanggal 5 bulan berikutnya)
            deadline = periode.tanggal_akhir + relativedelta(days=5)
            
            # Format tanggal dalam Bahasa Indonesia (memerlukan locale)
            # Cara sederhana:
            return f"{periode.tanggal_awal.strftime('%d %b')} - {deadline.strftime('%d %b %Y')}"
        except PeriodePenilaian.DoesNotExist:
            return "Belum Dibuat"
