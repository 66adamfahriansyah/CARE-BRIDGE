import { useState } from 'react';
import { Maximize2, MessageCircleHeart, Minus, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AssistantPanel } from './AssistantPanel';

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Hide floating widget on the dedicated /assistant page or staff dashboards
  if (
    location.pathname === '/assistant' ||
    location.pathname.startsWith('/kader') ||
    location.pathname.startsWith('/konselor')
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open ? (
        <div className="cb-modal-enter w-[calc(100vw-2rem)] max-w-md shadow-2xl">
          <AssistantPanel
            compact
            headerActions={
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate('/assistant');
                  }}
                  title="Buka halaman penuh CARE Assistant"
                  aria-label="Buka halaman penuh CARE Assistant"
                  className="rounded-lg p-1.5 text-[#58766B] hover:bg-[#E7F4EC] hover:text-[#135D43]"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  title="Perkecil"
                  aria-label="Perkecil"
                  className="rounded-lg p-1.5 text-[#58766B] hover:bg-[#E7F4EC] hover:text-[#135D43]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  title="Tutup"
                  aria-label="Tutup"
                  className="rounded-lg p-1.5 text-[#58766B] hover:bg-[#E7F4EC] hover:text-[#135D43]"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            }
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2.5 rounded-full border border-[#135D43]/15 bg-[#135D43] px-4 py-3 text-sm font-bold text-white shadow-xl hover:bg-[#0E4834]"
        >
          <MessageCircleHeart className="h-5 w-5" />
          <span>CARE Assistant</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
            Demo
          </span>
        </button>
      )}
    </div>
  );
}
