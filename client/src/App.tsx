import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AssistantWidget } from '@/components/AssistantWidget';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/context/AuthContext';
import { KioskProvider } from '@/context/KioskContext';
import { ToastProvider } from '@/context/ToastContext';
import { AssistantPage } from '@/pages/AssistantPage';
import { EducationDetailPage } from '@/pages/EducationDetailPage';
import { EducationListPage } from '@/pages/EducationListPage';
import { HelpEscalationPage } from '@/pages/HelpEscalationPage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ScreeningPage } from '@/pages/ScreeningPage';
import { ScreeningResultPage } from '@/pages/ScreeningResultPage';
import { KaderDashboardPage } from '@/pages/kader/KaderDashboardPage';
import { KaderEdukasiPage } from '@/pages/kader/KaderEdukasiPage';
import { KaderPendampinganDetailPage } from '@/pages/kader/KaderPendampinganDetailPage';
import { KaderPendampinganListPage } from '@/pages/kader/KaderPendampinganListPage';
import { KaderRiwayatPage } from '@/pages/kader/KaderRiwayatPage';
import { KonselorDashboardPage } from '@/pages/konselor/KonselorDashboardPage';
import { KonselorMateriPage } from '@/pages/konselor/KonselorMateriPage';
import { KonselorPengaturanPage } from '@/pages/konselor/KonselorPengaturanPage';
import { KonselorPermintaanPage } from '@/pages/konselor/KonselorPermintaanPage';
import { KonselorRujukanPage } from '@/pages/konselor/KonselorRujukanPage';
import { KonselorStatistikPage } from '@/pages/konselor/KonselorStatistikPage';
import { KonselorSupervisiPage } from '@/pages/konselor/KonselorSupervisiPage';
import { KonselorTindakLanjutPage } from '@/pages/konselor/KonselorTindakLanjutPage';

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <KioskProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/skrining" element={<ScreeningPage />} />
              <Route path="/hasil" element={<ScreeningResultPage />} />
              <Route path="/informasi" element={<EducationListPage />} />
              <Route path="/informasi/:slug" element={<EducationDetailPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/bantuan" element={<HelpEscalationPage />} />
              <Route path="/masuk" element={<LoginPage />} />

              {/* Kader Dashboard Routes */}
              <Route
                path="/kader"
                element={<Navigate to="/kader/dashboard" replace />}
              />
              <Route
                path="/kader/dashboard"
                element={
                  <ProtectedRoute allowedRole="kader">
                    <KaderDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kader/pendampingan"
                element={
                  <ProtectedRoute allowedRole="kader">
                    <KaderPendampinganListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kader/pendampingan/:id"
                element={
                  <ProtectedRoute allowedRole="kader">
                    <KaderPendampinganDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kader/riwayat"
                element={
                  <ProtectedRoute allowedRole="kader">
                    <KaderRiwayatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kader/edukasi"
                element={
                  <ProtectedRoute allowedRole="kader">
                    <KaderEdukasiPage />
                  </ProtectedRoute>
                }
              />

              {/* Konselor Dashboard Routes */}
              <Route
                path="/konselor"
                element={<Navigate to="/konselor/dashboard" replace />}
              />
              <Route
                path="/konselor/dashboard"
                element={
                  <ProtectedRoute allowedRole="konselor">
                    <KonselorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/konselor/permintaan"
                element={
                  <ProtectedRoute allowedRole="konselor">
                    <KonselorPermintaanPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/konselor/supervisi"
                element={
                  <ProtectedRoute allowedRole="konselor">
                    <KonselorSupervisiPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/konselor/rujukan"
                element={
                  <ProtectedRoute allowedRole="konselor">
                    <KonselorRujukanPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/konselor/tindak-lanjut"
                element={
                  <ProtectedRoute allowedRole="konselor">
                    <KonselorTindakLanjutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/konselor/materi"
                element={
                  <ProtectedRoute allowedRole="konselor">
                    <KonselorMateriPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/konselor/statistik"
                element={
                  <ProtectedRoute allowedRole="konselor">
                    <KonselorStatistikPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/konselor/pengaturan"
                element={
                  <ProtectedRoute allowedRole="konselor">
                    <KonselorPengaturanPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

            <AssistantWidget />
          </BrowserRouter>
        </KioskProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
