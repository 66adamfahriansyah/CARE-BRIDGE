import { Info, Monitor, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '@/context/KioskContext';

export function PrototypeBanner({
  showKioskClear = true,
}: {
  showKioskClear?: boolean;
}) {
  const { kioskMode, secondsRemaining, clearPublicSession, toggleKioskMode } = useKiosk();
  const navigate = useNavigate();

  const minutes = Math.floor(secondsRemaining / 60);
  const secs = String(secondsRemaining % 60).padStart(2, '0');

  return (
    <div className="border-b border-[#CBE7D8] bg-[#E9F6EF] text-[#114432]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-[#135D43]" />
          <p className="font-medium">
            Prototipe demonstrasi CARE BRIDGE. Belum digunakan untuk pelayanan klinis. Seluruh data
            yang ditampilkan merupakan data simulasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {kioskMode && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A6D8BE] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#135D43]">
              <Monitor className="h-3.5 w-3.5" />
              Mode Kiosk Aktif • Reset otomatis {minutes}:{secs}
            </span>
          )}

          {showKioskClear && (
            <button
              type="button"
              onClick={() => clearPublicSession({ onCleared: () => navigate('/') })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#135D43]/25 bg-white px-2.5 py-1 text-xs font-semibold text-[#135D43] hover:bg-[#135D43] hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Selesai dan Hapus Sesi
            </button>
          )}

          {kioskMode && (
            <button
              type="button"
              onClick={toggleKioskMode}
              className="rounded-lg px-2 py-1 text-xs font-medium text-[#2A5C49] underline hover:text-[#0E2D24]"
            >
              Keluar Mode Kiosk
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
