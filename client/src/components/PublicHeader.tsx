import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Menu,
  Monitor,
  UserCheck,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { useKiosk } from '@/context/KioskContext';

export function PublicHeader() {
  const { user } = useAuth();
  const { kioskMode, toggleKioskMode } = useKiosk();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-[#E6F4EC] text-[#135D43]'
        : 'text-[#28473D] hover:bg-[#EFF8F3] hover:text-[#135D43]'
    }`;

  const dashboardPath =
    user?.role === 'konselor' ? '/konselor/dashboard' : '/kader/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-[#DCEAE3] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="CARE BRIDGE Beranda">
          <BrandLogo />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 md:flex" aria-label="Navigasi utama">
          <NavLink to="/" end className={navLinkClass}>
            Beranda
          </NavLink>
          <NavLink to="/informasi" className={navLinkClass}>
            Informasi
          </NavLink>
          <NavLink to="/bantuan" className={navLinkClass}>
            Bantuan
          </NavLink>
          <NavLink to="/assistant" className={navLinkClass}>
            CARE Assistant
          </NavLink>
        </nav>

        {/* Right Controls matching Panel 1 */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <button
              type="button"
              onClick={() => navigate(dashboardPath)}
              className="inline-flex items-center gap-2 rounded-full bg-[#135D43] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0E4834]"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard {user.role === 'konselor' ? 'Konselor' : 'Kader'}</span>
              <span className="sm:hidden">Dashboard</span>
            </button>
          ) : (
            <Link
              to="/masuk"
              className="inline-flex items-center gap-2 rounded-full bg-[#135D43] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0E4834]"
            >
              <span>Masuk</span>
              <UserCheck className="h-4 w-4" />
            </Link>
          )}

          <button
            type="button"
            onClick={toggleKioskMode}
            title={kioskMode ? 'Nonaktifkan Mode Kiosk Layar Sentuh' : 'Aktifkan Mode Kiosk Layar Sentuh'}
            aria-pressed={kioskMode}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
              kioskMode
                ? 'border-[#135D43] bg-[#135D43] text-white'
                : 'border-[#CFE3D8] bg-[#EFF8F3] text-[#135D43] hover:bg-[#DFF1E7]'
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCEAE3] text-[#135D43] md:hidden"
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-[#DCEAE3] bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Menu seluler">
            <NavLink
              to="/"
              end
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Beranda
            </NavLink>
            <NavLink
              to="/informasi"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Informasi & Edukasi
            </NavLink>
            <NavLink
              to="/bantuan"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Bantuan & Eskalasi
            </NavLink>
            <NavLink
              to="/assistant"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              CARE Assistant (Demo)
            </NavLink>
            <NavLink
              to="/skrining"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Mulai Skrining
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}
