import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClass = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#09221A]/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cb-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`cb-modal-enter max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-[#DCEAE3] bg-white p-6 shadow-2xl ${maxWidthClass}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#EAF2EE] pb-4">
          <div>
            <h2 id="cb-modal-title" className="text-lg font-bold text-[#0E2D24]">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-[#47655B]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="rounded-xl p-1.5 text-[#5A756C] hover:bg-[#EFF8F3] hover:text-[#0E2D24]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}
