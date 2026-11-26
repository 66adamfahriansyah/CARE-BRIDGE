import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Settings,
  Share2,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BrandLogo, BrandMark } from './BrandLogo';
import { Modal } from './Modal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const KADER_NAV: NavItem[] = [
  { to: '/kader/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/kader/pendampingan', label: 'Pendampingan', icon: Users },
  { to: '/kader/riwayat', label: 'Riwayat', icon: History },
  { to: '/kader/edukasi', label: 'Edukasi', icon: BookOpen },
];

const KONSELOR_NAV: NavItem[] = [
  { to: '/konselor/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/konselor/permintaan', label: 'Permintaan', icon: ClipboardList },
  { to: '/konselor/supervisi', label: 'Supervisi', icon: Stethoscope },
  { to: '/konselor/rujukan', label: 'Rujukan', icon: Share2 },
  { to: '/konselor/tindak-lanjut', label: 'Tindak Lanjut', icon: ClipboardCheck },
  { to: '/konselor/materi', label: 'Materi Edukasi', icon: BookOpen },
  { to: '/konselor/statistik', label: 'Statistik', icon: BarChart3 },
  { to: '/konselor/pengaturan', label: 'Pengaturan', icon: Settings },
];

export function DashboardLayout({
  title,
  subtitle,
  children,
  onDemoReset,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onDemoReset?: () => void;
}) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const navItems = user?.role === 'konselor' ? KONSELOR_NAV : KADER_NAV;

  const handleLogout = async () => {
    await logout();
    showToast('Berhasil keluar dari sesi demonstrasi', { variant: 'info' });
    navigate('/masuk');
  };

  const handleConfirmReset = async () => {
    setResetting(true);
    try {
      await api.demo.reset();
      setResetModalOpen(false);
      showToast('Data demonstrasi dikembalikan ke kondisi awal');
      onDemoReset?.();
      window.dispatchEvent(new CustomEvent('cb:demo-reset'));
    } catch (err) {
      showToast('Gagal mereset data demo', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setResetting(false);
    }
  };

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 space-y-1.5 px-3 py-4" aria-label="Menu dashboard">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => isMobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#135D43] text-white shadow-sm'
                  : 'text-[#28473D] hover:bg-[#EAF5EF] hover:text-[#135D43]'
              }`
            }
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F4FAF6] text-[#0E2D24]">
      {/* Demo honesty bar */}
      <div className="border-b border-[#CFE5D8] bg-[#E8F6EE] px-4 py-1.5 text-center text-xs font-medium text-[#124B36]">
        Prototipe demonstrasi CARE BRIDGE. Belum digunakan untuk pelayanan klinis. Seluruh data
        yang ditampilkan merupakan data simulasi.
      </div>

      <div className="flex min-h-[calc(100vh-30px)]">
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`hidden shrink-0 flex-col border-r border-[#DCEAE3] bg-white transition-all duration-200 lg:flex ${
            collapsed ? 'w-[76px]' : 'w-64'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-[#EAF2EE] px-4">
            <Link to="/" className="flex items-center gap-2 overflow-hidden">
              {collapsed ? <BrandMark className="h-8 w-8" /> : <BrandLogo compact />}
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((p) => !p)}
              aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
              className="rounded-lg p-1.5 text-[#547267] hover:bg-[#EFF8F3] hover:text-[#135D43]"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          {renderNavLinks(false)}

          <div className="space-y-2 border-t border-[#EAF2EE] p-3">
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-xl border border-[#DCEAE3] px-3 py-2 text-xs font-semibold text-[#2E5245] hover:bg-[#F5FBF8]"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Halaman Publik</span>}
            </Link>
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-[#E6DFC5] bg-[#FFFDF5] px-3 py-2 text-xs font-semibold text-[#7A5E14] hover:bg-[#FEF7E0]"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Reset Data Demo</span>}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl border border-[#F3D0D0] bg-[#FFF8F8] px-3 py-2 text-xs font-semibold text-[#B42318] hover:bg-[#FEECEC]"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Keluar Sesi</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative z-10 flex w-72 flex-col bg-white shadow-2xl">
              <div className="flex h-16 items-center justify-between border-b border-[#EAF2EE] px-4">
                <BrandLogo compact />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Tutup menu"
                  className="rounded-lg p-1.5 text-[#547267]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderNavLinks(true)}
              <div className="space-y-2 border-t border-[#EAF2EE] p-3">
                <Link
                  to="/"
                  className="flex items-center gap-2 rounded-xl border border-[#DCEAE3] px-3 py-2 text-xs font-semibold text-[#2E5245]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Halaman Publik
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setResetModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl border border-[#E6DFC5] bg-[#FFFDF5] px-3 py-2 text-xs font-semibold text-[#7A5E14]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Data Demo
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl border border-[#F3D0D0] bg-[#FFF8F8] px-3 py-2 text-xs font-semibold text-[#B42318]"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar Sesi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#DCEAE3] bg-white/95 px-4 backdrop-blur-xs sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Buka menu navigasi"
                className="rounded-xl border border-[#DCEAE3] p-2 text-[#135D43] lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-base font-extrabold text-[#0E2D24] sm:text-lg">
                  {title}
                </h1>
                {subtitle && (
                  <p className="hidden truncate text-xs text-[#4F6E63] sm:block">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 rounded-full border border-[#CBE5D7] bg-[#EFF8F3] px-3 py-1 text-xs font-semibold text-[#135D43] sm:inline-flex">
                <Activity className="h-3.5 w-3.5" />
                Mode Demo Terhubung
              </span>

              {user && (
                <div className="flex items-center gap-2.5 rounded-full border border-[#DCEAE3] bg-[#F8FCFA] py-1 pl-1.5 pr-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#135D43] text-xs font-bold text-white">
                    {user.name
                      .split(' ')
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join('')}
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-xs font-bold text-[#0E2D24]">{user.name}</div>
                    <div className="text-[11px] font-medium capitalize text-[#4F6E63]">
                      {user.role === 'konselor' ? 'Konselor' : 'Kader'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>

      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Konfirmasi Reset Data Demonstrasi"
        description="Tindakan ini akan mengembalikan seluruh permintaan, tindak lanjut, supervisi, rujukan, dan artikel edukasi ke data awal simulasi."
      >
        <div className="space-y-4">
          <p className="rounded-xl bg-[#FFF8EE] p-3.5 text-sm text-[#7A5E14]">
            File proyek dan konfigurasi aplikasi tidak akan dihapus. Hanya isi database demonstrasi
            yang dikembalikan ke keadaan awal untuk keperluan presentasi.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
              className="rounded-xl border border-[#DCEAE3] px-4 py-2 text-sm font-semibold text-[#47655B]"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={resetting}
              onClick={handleConfirmReset}
              className="rounded-xl bg-[#135D43] px-4 py-2 text-sm font-bold text-white hover:bg-[#0E4834] disabled:opacity-60"
            >
              {resetting ? 'Mereset...' : 'Ya, Reset Data Demo'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
