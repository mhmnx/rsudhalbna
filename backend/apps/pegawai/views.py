# apps/pegawai/views.py
import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework import viewsets, permissions
from .models import Pegawai, UnitKerja, Bidang, Jabatan
from .serializers import PegawaiSerializer, UnitKerjaSerializer, BidangSerializer, JabatanSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from .serializers import PegawaiSerializer, PublicPegawaiSerializer
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
import logging
logger = logging.getLogger('apps.pegawai')

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class PegawaiViewSet(viewsets.ModelViewSet):
    queryset = Pegawai.objects.all().order_by('nama_lengkap')
    serializer_class = PegawaiSerializer
    permission_classes = [permissions.IsAuthenticated] # Hanya user terautentikasi

    @action(detail=False, methods=['get'], url_path='my-team')
    def my_team(self, request):
        """
        Mengembalikan data atasan langsung dan daftar rekan kerja
        dari pengguna yang sedang login.
        """
        
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

        atasan_data = None
        rekan_kerja_data = []

        # Ambil data atasan jika ada
        if user.atasan_langsung:
            atasan_serializer = self.get_serializer(user.atasan_langsung)
            atasan_data = atasan_serializer.data

        # Ambil data rekan kerja jika user punya unit kerja
        if user.unit_kerja:
            rekan_kerja = Pegawai.objects.filter(
                unit_kerja=user.unit_kerja
            ).exclude(pk=user.pk).order_by('nama_lengkap')
            rekan_serializer = self.get_serializer(rekan_kerja, many=True)
            rekan_kerja_data = rekan_serializer.data

        # Kembalikan data dalam format objek
        response_data = {
            'atasan': atasan_data,
            'rekan_kerja': rekan_kerja_data
        }
        return Response(response_data)

class UnitKerjaViewSet(viewsets.ModelViewSet):
    queryset = UnitKerja.objects.all()
    serializer_class = UnitKerjaSerializer
    permission_classes = [permissions.IsAuthenticated]
    # TAMBAHKAN DUA BARIS INI
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['bidang'] # Mengizinkan filter ?bidang=<id>

    def list(self, request, *args, **kwargs):

        return super().list(request, *args, **kwargs)
    
class BidangViewSet(viewsets.ModelViewSet):
    queryset = Bidang.objects.all()
    serializer_class = BidangSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request, *args, **kwargs):

        return super().list(request, *args, **kwargs)
    
class JabatanViewSet(viewsets.ModelViewSet):
    queryset = Jabatan.objects.all()
    serializer_class = JabatanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):

        return super().list(request, *args, **kwargs)
    
class SSOVerifyTokenView(APIView):
    """
    Menerima token dari aplikasi induk, memvalidasinya, menyinkronkan data pegawai,
    dan mengembalikan token JWT internal SPEKTA.
    """
    permission_classes = [permissions.AllowAny] # Siapapun boleh mengakses endpoint ini

    def post(self, request, *args, **kwargs):
        parent_token = request.data.get('token')
        if not parent_token:
            return Response({'error': 'Token tidak disediakan.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Validasi token ke server aplikasi induk
        try:
            headers = {'Authorization': f'Bearer {parent_token}'}
            verify_url = settings.PARENT_APP_VERIFY_TOKEN_URL
            response = requests.post(verify_url, headers=headers)
            response.raise_for_status() # Error jika status bukan 2xx
            sso_data = response.json()['response']['response']

        except requests.exceptions.RequestException as e:
            return Response({'error': 'Token tidak valid atau server induk tidak merespons.', 'details': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        # 2. Sinkronisasi data pegawai (get or create)
        nip = sso_data.get('nip')
        if not nip:
            return Response({'error': 'Data NIP tidak ditemukan dari token.'}, status=status.HTTP_400_BAD_REQUEST)

        # Logika get_or_create untuk Unit Kerja & Jabatan (sama seperti sync_pegawai)
        default_bidang, _ = Bidang.objects.get_or_create(nama_bidang='Belum Diatur')
        unit_kerja_obj, _ = UnitKerja.objects.get_or_create(
            nama_unit__iexact=sso_data.get('unitkerja').strip(),
            defaults={'nama_unit': sso_data.get('unitkerja').strip(), 'bidang': default_bidang}
        )
        jabatan_obj, _ = Jabatan.objects.get_or_create(
            nama_jabatan__iexact=sso_data.get('jabatan').strip(),
            defaults={'nama_jabatan': sso_data.get('jabatan').strip()}
        )

        pegawai_obj, created = Pegawai.objects.update_or_create(
                nip=nip,
                defaults={
                    'nama_lengkap': sso_data.get('nama'),
                    'gelar_depan': sso_data.get('gelarDepan'),
                    'gelar_belakang': sso_data.get('gelarBelakang', '').replace(', ', ''), # Menghapus koma
                    'email': f"{nip}@rsud.spekta.local", # Email placeholder
                    'pangkat_gol_ruang': sso_data.get('golongan'),
                    'jabatan': jabatan_obj,
                    'unit_kerja': unit_kerja_obj,
                    'penempatan_awal': sso_data.get('penempatanAwal'),
                    'jenis_pegawai': sso_data.get('jenisPegawai'),
                    'status_kepegawaian': sso_data.get('status'),
                    'status_perkawinan': sso_data.get('stskawin'),
                    'pendidikan_terakhir': sso_data.get('pendidikan'),
                    'alamat': sso_data.get('alamat', '').strip(), # Menghapus spasi/tab berlebih
                }
            )

        if created:
            pegawai_obj.set_password(nip) # Set NIP sebagai password default
            pegawai_obj.save()

        # 3. Buat token JWT internal SPEKTA untuk pegawai ini
        refresh = RefreshToken.for_user(pegawai_obj)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class PublicPegawaiView(APIView):
    """
    API untuk data pegawai.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, nip=None):
        if nip:
            try:
                pegawai = Pegawai.objects.get(nip=nip)
                # Gunakan serializer publik yang baru
                serializer = PublicPegawaiSerializer(pegawai)
                return Response(serializer.data)
            except Pegawai.DoesNotExist:
                return Response(
                    {'error': 'Pegawai dengan NIP tersebut tidak ditemukan.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            pegawai_list = Pegawai.objects.all().order_by('nama_lengkap')
            # Gunakan serializer publik yang baru
            serializer = PublicPegawaiSerializer(pegawai_list, many=True)
            return Response(serializer.data)
