import React from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#C7DFD2] bg-[#F8FCFA] px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F4EC] text-[#135D43]">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-base font-bold text-[#0E2D24]">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-[#47655B]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-[#F5B7B1] bg-[#FFF6F6] px-6 py-8 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FDE4E4] text-[#C93434]">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-base font-bold text-[#8E2222]">Gagal Memuat Data</h3>
      <p className="mt-1 max-w-md text-sm text-[#9B3333]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#F5B7B1] bg-white px-4 py-2 text-sm font-semibold text-[#C93434] hover:bg-[#FDECEC]"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </button>
      )}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="Sedang memuat data">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 w-full animate-pulse rounded-xl bg-[#EAF4EE]"
        />
      ))}
    </div>
  );
}
