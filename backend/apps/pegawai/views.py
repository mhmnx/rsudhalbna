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
    
class SSOLoginView(APIView):
    """
    View untuk menangani login via SSO.
    Menerima token dari frontend, memvalidasinya ke server SSO,
    dan mengembalikan token JWT internal jika valid.
    """
    # Tidak memerlukan autentikasi untuk mengakses view ini
    permission_classes = [] 

    def post(self, request, *args, **kwargs):
        sso_token = request.data.get('token')
        if not sso_token:

            return Response({'error': 'Token SSO tidak ditemukan.'}, status=status.HTTP_400_BAD_REQUEST)

        # Langkah 1: Validasi token ke server SSO eksternal
        try:
            validation_response = requests.post(
                settings.SSO_VALIDATE_TOKEN_URL, 
                json={'token': sso_token}
            )
            validation_response.raise_for_status() # Error jika status bukan 2xx

            sso_user_data = validation_response.json()
            # Pastikan API SSO mengembalikan NIP dalam responsnya
            nip_pegawai = sso_user_data.get('nip')

            if not nip_pegawai:

                return Response({'error': 'Data NIP tidak ditemukan dari token SSO.'}, status=status.HTTP_400_BAD_REQUEST)
        except requests.exceptions.RequestException:
            
            return Response({'error': 'Token SSO tidak valid atau server SSO tidak merespons.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            pegawai = Pegawai.objects.get(nip=nip_pegawai)

        except Pegawai.DoesNotExist:
            
            return Response({'error': f'Pegawai dengan NIP {nip_pegawai} tidak ditemukan di sistem ini.'}, status=status.HTTP_404_NOT_FOUND)

        refresh = RefreshToken.for_user(pegawai)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })