"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# core/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from apps.spekta.views import PublicPrintRedirectView
# Impor View kustom kita
from rest_framework_simplejwt.views import TokenRefreshView
# Impor View kustom kita
from apps.pegawai.views import MyTokenObtainPairView, SSOLoginView

schema_view = get_schema_view(
   openapi.Info(
      title="SPEKTA API",
      default_version='v1',
      description="Dokumentasi API untuk aplikasi SPEKTA (Sistem Penilaian Kinerja Staf)",
      contact=openapi.Contact(email="alfa.azkiya@gmail.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/logs/', include('log_viewer.urls')),
    path('admin/', admin.site.urls),
    path('admin/logs/', include('log_viewer.urls')),
    path('select2/', include('django_select2.urls')),
    
    

    # URL Autentikasi
    path('api/v1/auth/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/sso-login/', SSOLoginView.as_view(), name='sso_login'), # <-- TAMBAHKAN PATH INI

    # URL Aplikasi
    path('api/v1/pegawai/', include('apps.pegawai.urls')),
    path('api/v1/kinerja/', include('apps.spekta.urls')),
    
    path('api/v1/admin/kinerja/', include('apps.spekta.urls_admin')),
    
    path('api/v1/atasan/kinerja/', include('apps.spekta.urls_atasan')),
        # --- URL UNTUK DOKUMENTASI API ---
    # Tampilan Swagger UI
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    # Tampilan ReDoc
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    #
    path('kinerja/', include('apps.spekta.urls_public')),
    path('preview/<str:nip>/<int:year>/<int:month>/', PublicPrintRedirectView.as_view(), name='public-periode-detail'),
    
    path('pegawai/pegawai/', include('apps.pegawai.urls_public')),

]