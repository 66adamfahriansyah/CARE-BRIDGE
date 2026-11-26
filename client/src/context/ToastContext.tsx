import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (title: string, options?: { description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, options?: { description?: string; variant?: ToastVariant }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const variant = options?.variant ?? 'success';
      setToasts((prev) => [...prev, { id, title, description: options?.description, variant }]);
      window.setTimeout(() => {
        dismiss(id);
      }, 4500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const styleMap: Record<ToastVariant, string> = {
            success: 'border-[#B9E4CB] bg-white text-[#103A2B]',
            error: 'border-[#F5B7B1] bg-[#FFF8F8] text-[#9E2424]',
            info: 'border-[#C5DDF8] bg-white text-[#17467C]',
          };
          const Icon =
            toast.variant === 'error'
              ? AlertCircle
              : toast.variant === 'info'
                ? Info
                : CheckCircle2;
          const iconColor =
            toast.variant === 'error'
              ? 'text-[#C93434]'
              : toast.variant === 'info'
                ? 'text-[#1D65C1]'
                : 'text-[#15803D]';

          return (
            <div
              key={toast.id}
              role="status"
              className={`cb-step-enter flex items-start gap-3 rounded-xl border p-3.5 shadow-lg ${styleMap[toast.variant]}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs opacity-85">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Tutup notifikasi"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
