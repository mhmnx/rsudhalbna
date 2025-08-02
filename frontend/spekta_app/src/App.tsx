import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SkpPage } from './pages/SkpPage';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { SkpDetailPage } from './pages/SkpDetailPage'; // Impor halaman baru
import { MasterPerilakuPage } from './pages/admin/MasterPerilakuPage'; // Halaman yang akan kita buat
import { useAuth } from './context/AuthContext';
import { PersetujuanPage } from './pages/atasan/PersetujuanPage'; // Impor halaman
import { PenilaianPage } from './pages/PenilaianPage'; // Impor halaman baru
import { RencanaAksiPage } from './pages/RencanaAksiPage'; // Impor halaman baru
import { BuktiDukungPage } from './pages/BuktiDukungPage'; // Impor halaman baru
import { PenilaianListPage } from './pages/atasan/PenilaianListPage'; // Impor halaman baru
import { PeriodeListPage } from './pages/PeriodeListPage'; // Impor halaman baru
import { CetakPenilaianPage } from './pages/CetakPenilaianPage'; // Halaman yang akan kita buat
import { CetakEvaluasiPage } from './pages/CetakEvaluasiPage'; // Halaman yang akan kita buat
import { TimKerjaPage } from './pages/TimKerjaPage'; // Halaman yang akan kita buat
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'; // Halaman yang akan kita buat
import { PublicCetakPage } from './pages/PublicCetakPage'; // Halaman yang akan kita buat
import { AtasanDashboardPage } from './pages/atasan/AtasanDashboardPage';




function App() {
  const { user } = useAuth()
  const defaultPage = user?.role === 'ADMIN' ? <AdminDashboardPage /> : 
                    user?.role === 'ATASAN' ? <AtasanDashboardPage /> : <DashboardPage />;

    return (
      <> {/* Gunakan Fragment untuk membungkus beberapa komponen */}
        <Notifications /> {/* Letakkan komponen Notifications di sini */}
        <Routes>
      {/* Rute Publik */}
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><AppLayout>{defaultPage}</AppLayout></ProtectedRoute>} />

      <Route 
        path="/print-preview/:nip/:year/:month" 
        element={<PublicCetakPage />} // Rute ini tidak dilindungi
      />
      {/* Rute Privat yang Dilindungi */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              {/* Outlet atau halaman default di sini */}
              <DashboardPage /> 
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/skp"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SkpPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

        <Route
          path="/skp/:skpId" // ':skpId' adalah parameter dinamis
          element={
            <ProtectedRoute>
              <AppLayout>
                <SkpDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      
      <Route
        path="/persetujuan"
        element={
          <ProtectedRoute>
            <AppLayout><PersetujuanPage /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/penilaian/:skpId" // Rute baru untuk halaman penilaian
        element={
          <ProtectedRoute>
            <AppLayout><PenilaianPage /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
          path="/rencana-aksi/:skpId/:periodeId"
          element={
              <ProtectedRoute>
                  <AppLayout><RencanaAksiPage /></AppLayout>
              </ProtectedRoute>
          }
      />

      <Route
          path="/bukti-dukung/:periodeId"
          element={
              <ProtectedRoute>
                  <AppLayout><BuktiDukungPage /></AppLayout>
              </ProtectedRoute>
          }
      />

      <Route
          path="/penilaian"
          element={
              <ProtectedRoute>
                  <AppLayout><PenilaianListPage /></AppLayout>
              </ProtectedRoute>
          }
      />

      <Route
          path="/skp/:skpId/periode" // Rute baru
          element={
              <ProtectedRoute>
                  <AppLayout><PeriodeListPage /></AppLayout>
              </ProtectedRoute>
          }
      />
      
      <Route
        path="/cetak-penilaian/:periodeId"
        element={
          <ProtectedRoute>
            <CetakPenilaianPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cetak-evaluasi/:periodeId"
        element={
          <ProtectedRoute>
            <CetakEvaluasiPage />
          </ProtectedRoute>
        }
      />

      <Route
          path="/tim-kerja"
          element={
              <ProtectedRoute>
                  <AppLayout><TimKerjaPage /></AppLayout>
              </ProtectedRoute>
          }
      />

       {/* Rute Khusus Admin */}
      {user?.role === 'ADMIN' && (
        <Route
          path="/data-master/perilaku-kerja"
          element={
            <ProtectedRoute>
              <AppLayout><MasterPerilakuPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        
      )}
      {user?.role === 'ADMIN' && (
    <Route
        path="/admin/dashboard"
        element={
            <ProtectedRoute>
                <AppLayout><AdminDashboardPage /></AppLayout>
            </ProtectedRoute>
        }
    />
)}
    </Routes>
    </>
  );
}


export default App;