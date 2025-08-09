// src/App.tsx
import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SkpPage } from './pages/SkpPage';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { SkpDetailPage } from './pages/SkpDetailPage';
import { useAuth } from './context/AuthContext';
import axiosInstance from './api/axiosInstance';

// Impor semua halaman Anda
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AtasanDashboardPage } from './pages/atasan/AtasanDashboardPage';
import { MasterPerilakuPage } from './pages/admin/MasterPerilakuPage';
import { PersetujuanPage } from './pages/atasan/PersetujuanPage';
import { PenilaianListPage } from './pages/atasan/PenilaianListPage';
import { PenilaianPage } from './pages/PenilaianPage';
import { PeriodeListPage } from './pages/PeriodeListPage';
import { RencanaAksiPage } from './pages/RencanaAksiPage';
import { BuktiDukungPage } from './pages/BuktiDukungPage';
import { TimKerjaPage } from './pages/TimKerjaPage';
import { CetakPenilaianPage } from './pages/CetakPenilaianPage';
import { CetakEvaluasiPage } from './pages/CetakEvaluasiPage';
import { PublicCetakPage } from './pages/PublicCetakPage';


// Komponen kecil untuk menangani logika SSO
function SSOHandler() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSSOToken = async () => {
      const params = new URLSearchParams(location.search);
      const ssoToken = params.get('token');

      if (ssoToken) {
        try {
          const response = await axiosInstance.post('/auth/sso/verify/', { token: ssoToken });
          login(response.data.access);
          localStorage.setItem('refresh_token', response.data.refresh);
          navigate('/dashboard', { replace: true });
        } catch (error) {
          console.error("Verifikasi token SSO gagal:", error);
          navigate('/login', { replace: true });
        }
      }
    };
    handleSSOToken();
  }, [location, login, navigate]);

  return null; // Komponen ini tidak me-render apapun
}

// Komponen untuk menentukan halaman dashboard default
function DefaultDashboard() {
    const { user } = useAuth();
    if (user?.role === 'ADMIN') return <AdminDashboardPage />;
    if (user?.role === 'ATASAN') return <AtasanDashboardPage />;
    return <DashboardPage />;
}


function App() {
  return (
    <>
      <Notifications />
      <SSOHandler /> {/* Letakkan handler SSO di sini */}
      
      <Routes>
        {/* Rute Publik */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/print-preview/:nip/:year/:month" element={<PublicCetakPage />} />

        {/* Rute Terproteksi */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DefaultDashboard /> 
              </AppLayout>
            </ProtectedRoute>
          }
        />
        {/* Rute /dashboard sekarang juga otomatis menampilkan dashboard yang benar */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DefaultDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Rute-rute spesifik lainnya */}
        <Route path="/skp" element={<ProtectedRoute><AppLayout><SkpPage /></AppLayout></ProtectedRoute>} />
        <Route path="/skp/:skpId" element={<ProtectedRoute><AppLayout><SkpDetailPage /></AppLayout></ProtectedRoute>} />
        <Route path="/penilaian/:skpId" element={<ProtectedRoute><AppLayout><PenilaianPage /></AppLayout></ProtectedRoute>} />
        <Route path="/rencana-aksi/:skpId/:periodeId" element={<ProtectedRoute><AppLayout><RencanaAksiPage /></AppLayout></ProtectedRoute>} />
        <Route path="/bukti-dukung/:periodeId" element={<ProtectedRoute><AppLayout><BuktiDukungPage /></AppLayout></ProtectedRoute>} />
        <Route path="/skp/:skpId/periode" element={<ProtectedRoute><AppLayout><PeriodeListPage /></AppLayout></ProtectedRoute>} />
        <Route path="/tim-kerja" element={<ProtectedRoute><AppLayout><TimKerjaPage /></AppLayout></ProtectedRoute>} />

        {/* Rute Atasan */}
        <Route path="/persetujuan" element={<ProtectedRoute><AppLayout><PersetujuanPage /></AppLayout></ProtectedRoute>} />
        <Route path="/penilaian" element={<ProtectedRoute><AppLayout><PenilaianListPage /></AppLayout></ProtectedRoute>} />
        
        {/* Rute Admin */}
        <Route path="/data-master/perilaku-kerja" element={<ProtectedRoute><AppLayout><MasterPerilakuPage /></AppLayout></ProtectedRoute>} />

        {/* Rute Cetak */}
        <Route path="/cetak-penilaian/:periodeId" element={<ProtectedRoute><CetakPenilaianPage /></ProtectedRoute>} />
        <Route path="/cetak-evaluasi/:periodeId" element={<ProtectedRoute><CetakEvaluasiPage /></ProtectedRoute>} />

      </Routes>
    </>
  );
}

export default App;