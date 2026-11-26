import { useCallback, useEffect, useState } from 'react';
import type { SupervisionRequest, SupportRequest } from '@shared/types';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/EmptyState';
import { StatusBadge, SupervisionStatusBadge } from '@/components/StatusBadge';
import { api } from '@/services/api';
import { formatDateTime } from '@/utils/formatTime';

export function KaderRiwayatPage() {
  const [completed, setCompleted] = useState<SupportRequest[]>([]);
  const [supervisions, setSupervisions] = useState<SupervisionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [reqRes, supRes] = await Promise.all([
        api.requests.list({ status: 'selesai' }),
        api.supervisions.list(),
      ]);
      setCompleted(reqRes.requests);
      setSupervisions(supRes.supervisions);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat riwayat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    const onReset = () => loadHistory();
    window.addEventListener('cb:demo-reset', onReset);
    return () => window.removeEventListener('cb:demo-reset', onReset);
  }, [loadHistory]);

  return (
    <DashboardLayout
      title="Riwayat Pendampingan & Supervisi"
      subtitle="Arsip pendampingan yang telah diselesaikan serta status konsultasi supervisi"
      onDemoReset={loadHistory}
    >
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={loadHistory} />
      ) : (
        <div className="space-y-6">
          <section className="cb-card overflow-hidden">
            <div className="border-b border-[#EAF2EE] px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-[#0E2D24]">
                <CheckCircle2 className="h-5 w-5 text-[#15803D]" />
                Pendampingan Selesai ({completed.length})
              </h2>
            </div>

            {completed.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Belum ada riwayat selesai"
                  description="Kasus yang telah Anda tandai selesai akan otomatis tersimpan di sini."
                />
              </div>
            ) : (
              <div className="divide-y divide-[#EFF6F2]">
                {completed.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-[#0E2D24]">{item.anonymousCode}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-1 text-sm font-medium text-[#28473D]">{item.primaryNeed}</p>
                      <p className="text-xs text-[#5B7A6F]">
                        {item.locationPost} • Selesai {formatDateTime(item.updatedAt)}
                      </p>
                    </div>
                    <Link
                      to={`/kader/pendampingan/${item.id}`}
                      className="rounded-xl border border-[#CFE3D8] bg-white px-4 py-2 text-xs font-bold text-[#135D43] hover:bg-[#EFF8F3]"
                    >
                      Lihat Arsip
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="cb-card p-5">
            <h2 className="text-base font-extrabold text-[#0E2D24]">
              Riwayat Konsultasi Supervisi ke Konselor ({supervisions.length})
            </h2>
            <div className="mt-4 space-y-3">
              {supervisions.length === 0 ? (
                <p className="text-xs text-[#5B7A6F]">Belum ada pengajuan supervisi.</p>
              ) : (
                supervisions.map((sup) => (
                  <div
                    key={sup.id}
                    className="rounded-xl border border-[#E6F1EB] bg-[#F9FDFB] p-4 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        to={`/kader/pendampingan/${sup.requestId}`}
                        className="font-bold text-[#135D43] hover:underline"
                      >
                        {sup.anonymousCode} — {sup.reason}
                      </Link>
                      <SupervisionStatusBadge status={sup.status} />
                    </div>
                    {sup.counselorGuidance && (
                      <p className="mt-2 rounded-lg bg-[#F3E8FF] p-2.5 text-xs font-medium text-[#4C1D95]">
                        Arahan {sup.counselorName}: {sup.counselorGuidance}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
