# apps/spekta/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
import datetime
from datetime import date
from dateutil.relativedelta import relativedelta
from .models import SKP, RencanaHasilKerja, IndikatorKinerja, Lampiran
from .models import PeriodePenilaian, RencanaAksi, PerilakuKerja, EvaluasiAksi, EvaluasiPerilaku, BuktiDukung, MasterPerilakuKerja
from .serializers import SKPSerializer, RencanaHasilKerjaSerializer, IndikatorKinerjaSerializer,SKPDetailSerializer, MasterPerilakuKerjaSerializer
from .serializers import PeriodePenilaianSerializer, EvaluasiAksiSerializer, BuktiDukungSerializer,SKPLaporanSerializer, PerilakuKerjaSerializer
from .serializers import RHKDetailSerializer, RencanaAksiSerializer, PeriodePenilaianDetailSerializer, RatingSerializer, LampiranSerializer
from .serializers import EvaluasiPerilakuSerializer, PeriodePenilaianUpdateSerializer, PegawaiSerializer, AtasanDashboardBawahanSerializer
from django.db.models import Q 
from django.db import models
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from .permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend # Impor ini
from .serializers import AddPeriodeSerializer
from collections import defaultdict 
from apps.pegawai.models import Pegawai
from .serializers import KinerjaTahunanPublicSerializer
from django.shortcuts import render
import io
from openpyxl import Workbook
from django.http import HttpResponseRedirect
from django.http import HttpResponse
from django.conf import settings
import logging



logger = logging.getLogger('apps.spekta')

class SKPViewSet(viewsets.ModelViewSet):
    queryset = SKP.objects.all()
    serializer_class = SKPDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['pegawai'] # Ini mengizinkan filter ?pegawai=<id>

    def get_queryset(self):
        """
        Mengembalikan queryset yang sesuai:
        - User biasa hanya bisa melihat SKP miliknya sendiri.
        - Atasan bisa melihat SKP miliknya DAN SKP milik semua bawahannya.
        """
        user = self.request.user

        if not user.is_authenticated:
            return SKP.objects.none()

        # Ambil daftar ID dari bawahan user yang sedang login
        bawahan_ids = user.bawahan_list.values_list('id', flat=True)

        # Query: tampilkan SKP jika pemiliknya adalah user itu sendiri
        # ATAU jika pemiliknya ada di dalam daftar bawahannya.
        return SKP.objects.filter(
            Q(pegawai=user) | Q(pegawai_id__in=bawahan_ids)
        ).distinct().order_by('-periode_awal')

    def perform_create(self, serializer):
        """
        Override metode ini untuk mengisi data relasi secara otomatis.
        """
        pegawai = self.request.user
        atasan_langsung = pegawai.atasan_langsung
        
        # Inisialisasi atasan dari atasan
        atasan_dari_atasan = None
        if atasan_langsung:
            # Cari atasan dari atasan langsung
            atasan_dari_atasan = atasan_langsung.atasan_langsung

        # Simpan objek SKP dengan semua data relasi yang sudah ditemukan
        skp_instance = serializer.save(
            pegawai=pegawai,
            pejabat_penilai=atasan_langsung,
            atasan_pejabat_penilai=atasan_dari_atasan
        )



        # Logika untuk membuat PerilakuKerja (tidak berubah)
        master_perilaku_list = MasterPerilakuKerja.objects.all()
        perilaku_kerja_to_create = []
        for master in master_perilaku_list:
            perilaku_kerja_to_create.append(
                PerilakuKerja(skp=skp_instance, master_perilaku=master)
            )
        if perilaku_kerja_to_create:
            PerilakuKerja.objects.bulk_create(perilaku_kerja_to_create)

    def get_serializer_context(self):
        """
        Menambahkan context tambahan ke serializer.
        """
        context = super().get_serializer_context()
        # Ambil 'periode_id' dari query parameter URL (?periode_id=...)
        periode_id = self.request.query_params.get('periode_id')
        if periode_id:
            context['periode_id'] = periode_id
        return context
    
    # AKSI UNTUK PEGAWAI MENGAJUKAN SKP
    @action(detail=True, methods=['post'], url_path='submit')
    def submit_skp(self, request, pk=None):
        skp = self.get_object()


        # Validasi: Hanya pemilik SKP yang bisa mengajukan
        if request.user != skp.pegawai:

            return Response({'error': 'Anda tidak memiliki izin untuk melakukan aksi ini.'}, status=status.HTTP_403_FORBIDDEN)

        skp.status = 'Diajukan'
        skp.save()

        return Response({'status': 'SKP berhasil diajukan'}, status=status.HTTP_200_OK)

    # AKSI UNTUK ATASAN MENYETUJUI SKP
    @action(detail=True, methods=['post'], url_path='approve')
    def approve_skp(self, request, pk=None):
        skp = self.get_object()


        if request.user != skp.pejabat_penilai:
            
            return Response({'error': 'Anda tidak memiliki izin.'}, status=status.HTTP_403_FORBIDDEN)

        skp.status = 'Persetujuan'
        skp.save()


        return Response({'status': 'SKP berhasil disetujui'}, status=status.HTTP_200_OK)

    # AKSI UNTUK ATASAN MENOLAK SKP
    @action(detail=True, methods=['post'], url_path='reject')
    def reject_skp(self, request, pk=None):
        skp = self.get_object()
        if request.user != skp.pejabat_penilai:
            return Response({'error': 'Anda tidak memiliki izin.'}, status=status.HTTP_403_FORBIDDEN)

        # Ambil catatan dari data request
        catatan = request.data.get('catatan_penolakan', '')

        skp.status = 'Ditolak'
        skp.catatan_penolakan = catatan # Simpan catatan
        skp.save()

        logger.warning(f"Atasan NIP '{request.user.nip}' menolak SKP (ID: {skp.id}) dengan catatan: {catatan}")
        return Response({'status': 'SKP berhasil ditolak'}, status=status.HTTP_200_OK)


    @action(detail=True, methods=['get'], url_path='laporan-lengkap', serializer_class=SKPLaporanSerializer)
    def laporan_lengkap(self, request, pk=None):
        """
        Menyediakan semua data yang dibutuhkan untuk mencetak laporan SKP lengkap.
        """
        skp = self.get_object()
        serializer = self.get_serializer(skp)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='revert-to-draft')
    def revert_to_draft(self, request, pk=None):
        """
        Aksi untuk atasan mengembalikan SKP ke status Draft.
        """
        skp = self.get_object()

        # Validasi: Hanya pejabat penilai yang bisa melakukan ini
        if request.user != skp.pejabat_penilai:
            
            return Response(
                {'error': 'Anda tidak memiliki izin untuk melakukan aksi ini.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Validasi: Aksi ini mungkin hanya berlaku untuk status tertentu, misal 'Persetujuan'
        if skp.status not in ['Persetujuan']:

            return Response(
                {'error': f'SKP dengan status {skp.status} tidak dapat dikembalikan ke draft.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        skp.status = 'Draft'
        skp.save()
        
        return Response(
            {'status': 'SKP berhasil dikembalikan ke Draft'}, 
            status=status.HTTP_200_OK
        )
    @action(detail=True, methods=['post'], url_path='add-period')
    def add_period(self, request, pk=None):
        skp = self.get_object()
        pegawai = skp.pegawai # Ambil objek pegawai dari SKP
        # Validasi input (month, year)
        serializer = AddPeriodeSerializer(data=request.data)

        if not serializer.is_valid():
    
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        month = serializer.validated_data['month']
        year = serializer.validated_data['year']

        # Cek apakah periode sudah ada
        
        if PeriodePenilaian.objects.filter(skp=skp, tanggal_awal__month=month, tanggal_awal__year=year).exists():

            return Response({'error': 'Periode ini sudah ditambahkan.'}, status=status.HTTP_400_BAD_REQUEST)

        # Cek apakah periode berada dalam rentang SKP dan tidak di masa depan
        today = datetime.date.today()
        requested_date = datetime.date(year, month, 1)

        if not (skp.periode_awal <= requested_date <= skp.periode_akhir):
        
            return Response({'error': 'Periode di luar rentang SKP.'}, status=status.HTTP_400_BAD_REQUEST)

        if requested_date.year > today.year or (requested_date.year == today.year and requested_date.month > today.month):

            return Response({'error': 'Tidak dapat menambahkan periode untuk bulan mendatang.'}, status=status.HTTP_400_BAD_REQUEST)

        # Buat periode baru
        tanggal_awal = requested_date
        tanggal_akhir = tanggal_awal + relativedelta(months=1, days=-1)
        nama_periode = tanggal_awal.strftime('%B %Y')

        PeriodePenilaian.objects.create(
            skp=skp,
            nama_periode=nama_periode,
            tanggal_awal=tanggal_awal,
            tanggal_akhir=tanggal_akhir,
            # Isi field snapshot dengan data pegawai saat ini
            penilai_saat_itu=pegawai.atasan_langsung,
            jabatan_saat_itu=pegawai.jabatan,
            unit_kerja_saat_itu=pegawai.unit_kerja
        )
        
        return Response({'status': 'Periode berhasil ditambahkan'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='clean-duplicate-periods')
    def clean_duplicate_periods(self, request, pk=None):
        """
        Mencari dan menghapus periode penilaian yang duplikat (bulan dan tahun yang sama)
        untuk sebuah SKP, mempertahankan entri yang pertama dibuat.
        """
        skp = self.get_object()

        # Kelompokkan periode berdasarkan tahun dan bulan
        periods_by_month = defaultdict(list)
        for period in skp.periode_penilaian_list.all().order_by('id'):
            key = (period.tanggal_awal.year, period.tanggal_awal.month)
            periods_by_month[key].append(period.id)

        deleted_count = 0
        ids_to_delete = []
        # Loop melalui setiap kelompok
        for month_key, period_ids in periods_by_month.items():
            # Jika ada lebih dari satu ID dalam satu kelompok, itu adalah duplikat
            if len(period_ids) > 1:
                # Simpan ID pertama, tandai sisanya untuk dihapus
                ids_to_delete.extend(period_ids[1:])

        if ids_to_delete:
            deleted_count, _ = PeriodePenilaian.objects.filter(id__in=ids_to_delete).delete()
            
        
        return Response(
            {'status': f'{deleted_count} periode duplikat berhasil dihapus.'}, 
            status=status.HTTP_200_OK
        )
        
    @action(detail=True, methods=['post'], url_path='get-or-create-lampiran')
    def get_or_create_lampiran(self, request, pk=None):
        """
        Mengambil atau membuat objek Lampiran yang terhubung ke SKP ini.
        """
        skp = self.get_object()
        # Logika get_or_create akan mencari lampiran, jika tidak ada, ia akan membuat yang baru.
        lampiran, created = Lampiran.objects.get_or_create(skp=skp)
        serializer = LampiranSerializer(lampiran)
    
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class RencanaHasilKerjaViewSet(viewsets.ModelViewSet):
    queryset = RencanaHasilKerja.objects.all()
    serializer_class = RencanaHasilKerjaSerializer
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RHKDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Hanya tampilkan RHK yang dimiliki oleh user yang sedang login
        
        return RencanaHasilKerja.objects.filter(skp__pegawai=self.request.user)

class IndikatorKinerjaViewSet(viewsets.ModelViewSet):
    queryset = IndikatorKinerja.objects.all()
    serializer_class = IndikatorKinerjaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Hanya tampilkan Indikator yang dimiliki oleh user yang sedang login
        return IndikatorKinerja.objects.filter(rhk__skp__pegawai=self.request.user)
    
class PersetujuanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet read-only untuk menampilkan daftar SKP yang memerlukan persetujuan atasan.
    """
    serializer_class = SKPSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Pengecekan hak akses secara eksplisit
        if user.role != 'ATASAN':
            # Kembalikan queryset kosong jika bukan atasan
        
            return SKP.objects.none()

        # Logika yang sudah ada: Tampilkan SKP bawahan yang statusnya 'Diajukan'
        
        return SKP.objects.filter(pejabat_penilai=user, status='Diajukan')
    

class EvaluasiAksiViewSet(viewsets.ModelViewSet):
    queryset = EvaluasiAksi.objects.all()
    serializer_class = EvaluasiAksiSerializer
    permission_classes = [permissions.IsAuthenticated]

    # TAMBAHKAN METODE INI UNTUK DEBUG
    def partial_update(self, request, *args, **kwargs):
        evaluasi = self.get_object()
        periode = evaluasi.periode

        # --- LOGIKA VALIDASI BARU ---
        # Cek apakah periode dikunci paksa oleh admin
        if not periode.force_unlocked:
            # Jika tidak, jalankan pengecekan deadline seperti biasa
            deadline = periode.tanggal_akhir + relativedelta(days=5)
            if datetime.date.today() > deadline:
                return Response({'error': 'Batas waktu pengisian telah berakhir.'}, status=status.HTTP_403_FORBIDDEN)
        
        print("=== DATA DITERIMA UNTUK UPDATE REALISASI ===")
        print(request.data)
        print("==========================================")
        return super().partial_update(request, *args, **kwargs)
    # --- PASTIKAN DEKORATOR INI SUDAH BENAR ---
    @action(detail=False, methods=['post'], url_path='get-or-create')
    def get_or_create(self, request):
        rencana_aksi_id = request.data.get('rencana_aksi')
        periode_penilaian_id = request.data.get('periode')
        

        if not rencana_aksi_id or not periode_penilaian_id:
        
            return Response({'error': 'rencana_aksi and periode are required.'}, status=status.HTTP_400_BAD_REQUEST)

        evaluasi, created = EvaluasiAksi.objects.get_or_create(
            rencana_aksi_id=rencana_aksi_id,
            periode_id=periode_penilaian_id
        )
        
        serializer = self.get_serializer(evaluasi)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
        
class LaporanMonitoringView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Hanya user dengan role ADMIN yang bisa melanjutkan
        if request.user.role != 'ADMIN':
            raise PermissionDenied("Anda tidak memiliki hak akses untuk melihat laporan ini.")
        
        # Logika untuk mengambil data monitoring...
        data = { "belum_mengisi_skp": 10, "sudah_dinilai": 50 }
        return Response(data)

class PerilakuKerjaViewSet(viewsets.ModelViewSet):
    queryset = PerilakuKerja.objects.all()
    serializer_class = PerilakuKerjaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Hanya tampilkan data yang relevan dengan user atau bawahannya
        user = self.request.user
        bawahan_ids = user.bawahan_list.values_list('id', flat=True)
        return PerilakuKerja.objects.filter(
            Q(skp__pegawai=user) | Q(skp__pegawai_id__in=bawahan_ids)
        )

class MasterPerilakuKerjaViewSet(viewsets.ModelViewSet):
    queryset = MasterPerilakuKerja.objects.all()
    serializer_class = MasterPerilakuKerjaSerializer
    permission_classes = [IsAdminUser] # Terapkan hak akses khusus Admin

class PublicMasterPerilakuKerjaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet read-only untuk menampilkan data Master Perilaku Kerja
    kepada semua pengguna yang sudah login.
    """
    queryset = MasterPerilakuKerja.objects.all()
    serializer_class = MasterPerilakuKerjaSerializer
    permission_classes = [permissions.IsAuthenticated] # Untuk semua user terotentikasi


class RencanaAksiViewSet(viewsets.ModelViewSet):
    queryset = RencanaAksi.objects.all()
    serializer_class = RencanaAksiSerializer # Menggunakan serializer yang sudah kita perbaiki
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # User hanya bisa melihat Rencana Aksi dari SKP miliknya
        return RencanaAksi.objects.filter(rhk__skp__pegawai=self.request.user)

class PeriodePenilaianViewSet(viewsets.ModelViewSet):
    queryset = PeriodePenilaian.objects.all().order_by('tanggal_awal')
    # Serializer default tetap yang detail, untuk menampilkan data
    serializer_class = PeriodePenilaianDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """
        Menggunakan serializer yang berbeda untuk aksi yang berbeda.
        """
        if self.action in ['update', 'partial_update']:
            # Saat menyimpan (PATCH), gunakan serializer yang sederhana
            return PeriodePenilaianUpdateSerializer
        # Untuk semua aksi lainnya (GET), gunakan serializer yang detail
        return super().get_serializer_class()

    def get_queryset(self):
        """
        Memastikan pengguna hanya bisa melihat periode penilaian dari SKP
        miliknya sendiri atau milik bawahannya.
        """
        user = self.request.user
        if not user.is_authenticated:
            return PeriodePenilaian.objects.none()

        bawahan_ids = user.bawahan_list.values_list('id', flat=True)
        return self.queryset.filter(
            Q(skp__pegawai=user) | Q(skp__pegawai_id__in=bawahan_ids)
        ).distinct()

    # Metode ini digunakan untuk menangani request PATCH (update parsial dari form rating)
    


class BuktiDukungViewSet(viewsets.ModelViewSet):
    queryset = BuktiDukung.objects.all()
    serializer_class = BuktiDukungSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # User hanya bisa akses bukti dukung dari SKP miliknya
        return BuktiDukung.objects.filter(evaluasi_aksi__rencana_aksi__rhk__skp__pegawai=self.request.user)

    def _validate_deadline(self, bukti_dukung_instance):
        """
        Fungsi helper internal untuk validasi batas waktu.
        Mengembalikan None jika valid, atau HttpResponse jika tidak valid.
        """
        periode = bukti_dukung_instance.evaluasi_aksi.periode
        if not periode.force_unlocked:
            deadline = periode.tanggal_akhir + relativedelta(days=5)
            if datetime.date.today() > deadline:
                return Response(
                    {'error': 'Batas waktu pengisian untuk periode ini telah berakhir.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        return None # Validasi lolos

    def create(self, request, *args, **kwargs):
        evaluasi_aksi_id = request.data.get('evaluasi_aksi')
        if evaluasi_aksi_id:
            try:
                evaluasi = EvaluasiAksi.objects.get(pk=evaluasi_aksi_id)
                periode = evaluasi.periode
                if not periode.force_unlocked:
                    deadline = periode.tanggal_akhir + relativedelta(days=5)
                    if datetime.date.today() > deadline:
                        return Response({'error': 'Batas waktu pengisian telah berakhir.'}, status=status.HTTP_403_FORBIDDEN)
            except EvaluasiAksi.DoesNotExist:
                pass
        
        return super().create(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """
        Lengkap dengan validasi batas waktu untuk operasi EDIT.
        """
        bukti_dukung = self.get_object()
        validation_error = self._validate_deadline(bukti_dukung)
        if validation_error:
            return validation_error # Kembalikan error jika validasi gagal

        # Jika validasi lolos, lanjutkan proses update
        return super().partial_update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """
        Lengkap dengan validasi batas waktu untuk operasi HAPUS.
        """
        bukti_dukung = self.get_object()
        validation_error = self._validate_deadline(bukti_dukung)
        if validation_error:
            return validation_error # Kembalikan error jika validasi gagal

        # Jika validasi lolos, lanjutkan proses hapus
        return super().destroy(request, *args, **kwargs)
# apps/spekta/views.py

class PenilaianListViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet read-only untuk menampilkan daftar SKP yang perlu dinilai oleh atasan.
    """
    serializer_class = SKPSerializer # Kita bisa gunakan serializer yang sudah ada
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Tampilkan SKP bawahan yang statusnya sudah 'Persetujuan'
        return SKP.objects.filter(pejabat_penilai=user, status='Persetujuan').order_by('-periode_awal')
    
class LampiranViewSet(viewsets.ModelViewSet):
    queryset = Lampiran.objects.all()
    serializer_class = LampiranSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Ensure users can only access lampiran from their own SKP
        return Lampiran.objects.filter(skp__pegawai=self.request.user)

class EvaluasiPerilakuViewSet(viewsets.ModelViewSet):
    queryset = EvaluasiPerilaku.objects.all()
    serializer_class = EvaluasiPerilakuSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='get-or-create')
    def get_or_create(self, request):
        perilaku_kerja_id = request.data.get('perilaku_kerja')
        periode_id = request.data.get('periode')

        if not perilaku_kerja_id or not periode_id:
            return Response({'error': 'perilaku_kerja and periode are required.'}, status=status.HTTP_400_BAD_REQUEST)

        evaluasi, created = EvaluasiPerilaku.objects.get_or_create(
            perilaku_kerja_id=perilaku_kerja_id,
            periode_id=periode_id
        )

        serializer = self.get_serializer(evaluasi)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class KinerjaPegawaiAPIView(APIView):
    """
    API Publik untuk melihat kienerja pegawai
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, nip, year, month=None):
        try:
            pegawai = Pegawai.objects.get(nip=nip)
            skp = SKP.objects.get(
                pegawai=pegawai,
                periode_awal__year=year,
                status='Persetujuan'
            )

            # Siapkan context untuk dikirim ke serializer
            serializer_context = {
                'request': request,
                'month': month # Kirim 'month' dari URL ke context
            }

            serializer = KinerjaTahunanPublicSerializer(skp, context=serializer_context)
            return Response(serializer.data)

        except Pegawai.DoesNotExist:
            return Response({'error': 'Pegawai dengan NIP tersebut tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        except SKP.DoesNotExist:
            return Response({'error': f'Data SKP untuk tahun {year} tidak ditemukan atau belum disetujui.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PublicPrintRedirectView(APIView):
    """
    View ini tidak mengembalikan data, tetapi me-redirect ke halaman
    cetak di frontend berdasarkan parameter query.
    """
    permission_classes = [permissions.AllowAny] # Mengizinkan akses publik

    def get(self, request, nip, year, month):
        try:
            # Cari periode penilaian yang sesuai
            periode = PeriodePenilaian.objects.get(
                skp__pegawai__nip=nip,
                tanggal_awal__year=year,
                tanggal_awal__month=month,
                skp__status='Persetujuan' # Hanya tampilkan data yang sudah disetujui
            )

            # Gunakan serializer detail yang sudah kita punya
            serializer = PeriodePenilaianDetailSerializer(periode)
            return Response(serializer.data)

        except PeriodePenilaian.DoesNotExist:
            return Response({'error': 'Data penilaian untuk periode tersebut tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)


class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        year = request.query_params.get('year', datetime.date.today().year)
        # Ambil parameter bulan (opsional)
        month = request.query_params.get('month')

        pegawai_filtered_qs = Pegawai.objects.filter(jenis_pegawai__in=['BLUD', 'THL'])

        total_pegawai = pegawai_filtered_qs.count()
        total_skp_tahunan = SKP.objects.filter(
            periode_awal__year=year,
            pegawai__in=pegawai_filtered_qs
        ).count()

        # --- PERBAIKAN LOGIKA DI SINI ---
        # Buat queryset dasar untuk periode
        periode_qs = PeriodePenilaian.objects.filter(
            skp__periode_awal__year=year,
            skp__pegawai__in=pegawai_filtered_qs
        )

        # Jika parameter bulan diberikan, filter lebih lanjut
        if month:
            periode_qs = periode_qs.filter(tanggal_awal__month=month)

        # Hitung total berdasarkan queryset yang sudah difilter
        total_periode_dibuat = periode_qs.count()
        total_periode_dinilai = periode_qs.filter(
            predikat_kinerja__isnull=False
        ).exclude(predikat_kinerja='').count()

        data = {
            'total_pegawai': total_pegawai,
            'total_skp_tahunan': total_skp_tahunan,
            'total_periode_dibuat': total_periode_dibuat,
            'total_periode_dinilai': total_periode_dinilai
        }
        return Response(data)


class PegawaiDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        pegawai = request.user
        current_year = datetime.date.today().year

        # Cari SKP aktif untuk tahun ini
        skp_aktif = SKP.objects.filter(pegawai=pegawai, periode_awal__year=current_year).first()

        # Cari periode terakhir yang sudah dinilai
        periode_terakhir_dinilai = None
        if skp_aktif:
            periode_terakhir_dinilai = PeriodePenilaian.objects.filter(
                skp=skp_aktif, 
                predikat_kinerja__isnull=False
            ).order_by('-tanggal_akhir').first()

        # Tentukan tugas berikutnya (logika sederhana)
        tugas_berikutnya = "Tidak ada tugas mendesak."
        if skp_aktif:
            if skp_aktif.status == 'Draft' or skp_aktif.status == 'Ditolak':
                tugas_berikutnya = "Anda perlu melengkapi dan mengajukan SKP Anda."
            elif skp_aktif.status == 'Persetujuan':
                tugas_berikutnya = "Menunggu penilaian bulanan dari atasan."
            elif skp_aktif.status == 'Diajukan':
                tugas_berikutnya = "SKP Anda sedang ditinjau oleh atasan."


        # Siapkan data untuk dikirim
        data = {
            'pegawai_info': PegawaiSerializer(pegawai).data,
            'skp_aktif': SKPSerializer(skp_aktif).data if skp_aktif else None,
            'periode_terakhir_dinilai': PeriodePenilaianSerializer(periode_terakhir_dinilai).data if periode_terakhir_dinilai else None,
            'tugas_berikutnya': tugas_berikutnya
        }

        return Response(data)


class MonitoringPegawaiView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Ambil filter dari query params
        unit_kerja_id = request.query_params.get('unit_kerja')
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        
        if not year or not month:
            return Response({'error': 'Parameter `year` dan `month` wajib diisi.'}, status=status.HTTP_400_BAD_REQUEST)

        pegawai_qs = Pegawai.objects.filter(jenis_pegawai__in=['BLUD', 'THL'])
        #pegawai_qs = Pegawai.objects.all()
        if unit_kerja_id:
            pegawai_qs = pegawai_qs.filter(unit_kerja_id=unit_kerja_id)

        response_data = []
        for pegawai in pegawai_qs:
            try:
                # Cari periode penilaian yang relevan untuk pegawai ini
                periode = PeriodePenilaian.objects.get(
                    skp__pegawai=pegawai,
                    tanggal_awal__year=year,
                    tanggal_awal__month=month
                )
                # Gunakan logika 'is_ready_for_assessment' yang sudah ada
                serializer = PeriodePenilaianSerializer(periode) # Gunakan serializer sederhana
                sudah_mengisi = serializer.get_is_ready_for_assessment(periode)
                sudah_dinilai = bool(periode.predikat_kinerja)
                predikat_kinerja = periode.predikat_kinerja or '-'
            except PeriodePenilaian.DoesNotExist:
                sudah_mengisi = False
                sudah_dinilai = False
                predikat_kinerja = '-'
            
            response_data.append({
                'id': pegawai.id,
                'nama_lengkap': pegawai.nama_lengkap,
                'nip': pegawai.nip,
                'jabatan': pegawai.jabatan.nama_jabatan if pegawai.jabatan else '-',
                'sudah_mengisi': sudah_mengisi,
                'sudah_dinilai': sudah_dinilai,
                'predikat_kinerja': predikat_kinerja # <-- Tambahkan ke respons
            })
        
        return Response(response_data)

class ExportMonitoringExcelView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        unit_kerja_id = request.query_params.get('unit_kerja')
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        if not year or not month:
            return Response({'error': 'Parameter `year` dan `month` wajib diisi.'}, status=status.HTTP_400_BAD_REQUEST)

        # Query data pegawai (sama seperti di MonitoringPegawaiView)
        pegawai_qs = Pegawai.objects.filter(jenis_pegawai__in=['BLUD', 'THL'])
        if unit_kerja_id:
            pegawai_qs = pegawai_qs.filter(unit_kerja_id=unit_kerja_id)
        
        # Siapkan workbook Excel
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = f"Laporan SKP {month}-{year}"

        # Buat Header
        headers = [
            "Nama Pegawai", "NIP", "Jabatan", "Unit Kerja", 
            "Status Pengisian", "Status Penilaian", "Predikat Kinerja" # <-- Tambah kolom
        ]
        sheet.append(headers)

        # Isi baris data
        for pegawai in pegawai_qs:
            try:
                periode = PeriodePenilaian.objects.get(
                    skp__pegawai=pegawai,
                    tanggal_awal__year=year,
                    tanggal_awal__month=month
                )
                serializer = PeriodePenilaianSerializer(periode)
                sudah_mengisi = "Lengkap" if serializer.get_is_ready_for_assessment(periode) else "Belum"
                sudah_dinilai = "Sudah" if periode.predikat_kinerja else "Belum"
            except PeriodePenilaian.DoesNotExist:
                sudah_mengisi = "Belum"
                sudah_dinilai = "Belum"
                predikat_kinerja = '-'
            
            row_data = [
                pegawai.nama_lengkap,
                pegawai.nip,
                pegawai.jabatan.nama_jabatan if pegawai.jabatan else '-',
                pegawai.unit_kerja.nama_unit if pegawai.unit_kerja else '-',
                sudah_mengisi,
                sudah_dinilai,
                predikat_kinerja # <-- Tambah data ke baris
            ]
            sheet.append(row_data)
        
        # Simpan ke memori
        virtual_workbook = io.BytesIO()
        workbook.save(virtual_workbook)
        virtual_workbook.seek(0)

        # Buat respons HTTP untuk mengunduh file
        response = HttpResponse(
            virtual_workbook,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        filename = f"laporan_skp_{month}_{year}.xlsx"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        return response

class AtasanDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'ATASAN':
            return Response({"error": "Hanya atasan yang dapat mengakses halaman ini."}, status=status.HTTP_403_FORBIDDEN)

        # --- PERBAIKAN DI SINI ---
        # Ambil semua bawahan, lalu filter hanya yang BLUD dan THL
        bawahan = user.bawahan_list.filter(
            jenis_pegawai__in=['BLUD', 'THL']
        ).order_by('nama_lengkap')
        
        serializer = AtasanDashboardBawahanSerializer(bawahan, many=True)
        return Response(serializer.data)