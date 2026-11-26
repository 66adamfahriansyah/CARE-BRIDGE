import React, { useCallback, useEffect, useState } from 'react';
import type { SupervisionRequest, SupervisionStatus, SupportRequest } from '@shared/types';
import { Send, Stethoscope } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { StatusBadge, SupervisionStatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { formatDateTime } from '@/utils/formatTime';

export function KonselorSupervisiPage() {
  const { showToast } = useToast();

  const [supervisions, setSupervisions] = useState<SupervisionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [activeSup, setActiveSup] = useState<SupervisionRequest | null>(null);
  const [caseDetail, setCaseDetail] = useState<SupportRequest | null>(null);
  const [guidance, setGuidance] = useState('');
  const [supStatus, setSupStatus] = useState<SupervisionStatus>('arahan_dikirim');
  const [reqStatusAfter, setReqStatusAfter] = useState<
    'dalam_proses' | 'perlu_supervisi' | 'menunggu_rujukan' | 'selesai'
  >('dalam_proses');
  const [saving, setSaving] = useState(false);

  const loadSupervisions = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.supervisions.list();
      setSupervisions(res.supervisions);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat antrean supervisi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSupervisions();
    const onReset = () => loadSupervisions();
    window.addEventListener('cb:demo-reset', onReset);
    return () => window.removeEventListener('cb:demo-reset', onReset);
  }, [loadSupervisions]);

  const openSupervisionModal = async (sup: SupervisionRequest) => {
    setActiveSup(sup);
    setGuidance(sup.counselorGuidance || '');
    setSupStatus(sup.status === 'menunggu' ? 'arahan_dikirim' : sup.status);
    setReqStatusAfter('dalam_proses');
    try {
      const res = await api.requests.getById(sup.requestId);
      setCaseDetail(res.request);
    } catch {
      setCaseDetail(null);
    }
  };

  const handleSubmitGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSup || guidance.trim().length < 5) {
      showToast('Arahan supervisi minimal 5 karakter', { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.supervisions.respond(activeSup.id, {
        status: supStatus,
        counselorGuidance: guidance.trim(),
        requestStatusAfter: reqStatusAfter,
      });
      showToast(`Arahan supervisi untuk ${activeSup.anonymousCode} berhasil dikirim ke kader`);
      setActiveSup(null);
      setCaseDetail(null);
      await loadSupervisions();
    } catch (err) {
      showToast('Gagal mengirim arahan supervisi', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Supervisi Kader Pendamping"
      subtitle="Tinjau pengajuan supervisi dari kader, periksa konteks kasus, dan kirim arahan tindak lanjut"
      onDemoReset={loadSupervisions}
    >
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={loadSupervisions} />
      ) : supervisions.length === 0 ? (
        <EmptyState
          title="Belum ada permintaan supervisi"
          description="Permintaan konsultasi yang diajukan kader akan muncul di halaman ini."
        />
      ) : (
        <div className="cb-step-enter space-y-4">
          {supervisions.map((sup) => (
            <div key={sup.id} className="cb-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 font-extrabold text-[#0E2D24]">
                      <Stethoscope className="h-4 w-4 text-[#6D28D9]" />
                      {sup.anonymousCode}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        sup.supervisionType === 'konsultasi_segera'
                          ? 'bg-[#FDECEC] text-[#B42318]'
                          : 'bg-[#EFF8F3] text-[#135D43]'
                      }`}
                    >
                      {sup.supervisionType === 'konsultasi_segera'
                        ? 'Konsultasi Segera (Prioritas)'
                        : 'Supervisi Terjadwal'}
                    </span>
                    <SupervisionStatusBadge status={sup.status} />
                    <span className="text-xs text-[#5B7A6F]">
                      Diajukan oleh <strong>{sup.kaderName}</strong> • {formatDateTime(sup.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#113D2E]">{sup.reason}</p>
                  <p className="text-xs leading-relaxed text-[#47655B]">
                    Ringkasan Kader: {sup.kaderSummary}
                  </p>

                  {sup.counselorGuidance && (
                    <div className="mt-2 rounded-xl border border-[#DFD2FA] bg-[#F8F5FF] p-3 text-xs text-[#4C1D95]">
                      <strong>Arahan Konselor ({sup.counselorName}):</strong>{' '}
                      {sup.counselorGuidance}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openSupervisionModal(sup)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#135D43] px-4 py-2 text-xs font-bold text-white hover:bg-[#0E4834]"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sup.counselorGuidance ? 'Perbarui Arahan' : 'Tinjau & Beri Arahan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(activeSup)}
        onClose={() => {
          setActiveSup(null);
          setCaseDetail(null);
        }}
        title={`Supervisi Kasus — ${activeSup?.anonymousCode ?? ''}`}
        description={`Kader pengaju: ${activeSup?.kaderName ?? ''}`}
        maxWidthClass="max-w-2xl"
      >
        {activeSup && (
          <form onSubmit={handleSubmitGuidance} className="space-y-4">
            {caseDetail && (
              <div className="rounded-xl border border-[#DCEAE3] bg-[#F8FCFA] p-4 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm text-[#0E2D24]">
                    Kebutuhan: {caseDetail.primaryNeed}
                  </strong>
                  <StatusBadge status={caseDetail.status} />
                </div>
                <p className="mt-1 text-[#47655B]">{caseDetail.needSummary}</p>
                <p className="mt-1 text-[#5B7A6F]">
                  Posko: {caseDetail.locationPost} • Dukungan sosial: {caseDetail.socialSupportInfo}
                </p>
              </div>
            )}

            <div className="rounded-xl bg-[#F8F5FF] p-3.5 text-xs text-[#3B1773]">
              <p className="font-bold">Pertanyaan / Alasan Kader:</p>
              <p className="mt-0.5">{activeSup.reason}</p>
              <p className="mt-2 font-bold">Ringkasan Lapangan Kader:</p>
              <p className="mt-0.5">{activeSup.kaderSummary}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#0E2D24]">
                  Status Supervisi
                </label>
                <select
                  value={supStatus}
                  onChange={(e) => setSupStatus(e.target.value as SupervisionStatus)}
                  className="mt-1 w-full rounded-xl border border-[#CFE3D8] bg-white px-3 py-2 text-sm"
                >
                  <option value="ditinjau">Sedang Ditinjau</option>
                  <option value="arahan_dikirim">Arahan Dikirim ke Kader</option>
                  <option value="selesai">Supervisi Selesai</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E2D24]">
                  Status Kasus Setelah Arahan
                </label>
                <select
                  value={reqStatusAfter}
                  onChange={(e) =>
                    setReqStatusAfter(
                      e.target.value as
                        | 'dalam_proses'
                        | 'perlu_supervisi'
                        | 'menunggu_rujukan'
                        | 'selesai',
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-[#CFE3D8] bg-white px-3 py-2 text-sm"
                >
                  <option value="dalam_proses">Kembali Dalam Proses Kader</option>
                  <option value="perlu_supervisi">Tetap Perlu Supervisi</option>
                  <option value="menunggu_rujukan">Menunggu Rujukan</option>
                  <option value="selesai">Tandai Selesai</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E2D24]">
                Catatan &amp; Arahan Tindak Lanjut untuk Kader
              </label>
              <textarea
                rows={4}
                required
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                placeholder="Tuliskan arahan pendampingan yang jelas, terstruktur, dan mudah dijalankan kader di lapangan..."
                className="mt-1 w-full rounded-xl border border-[#CFE3D8] p-3 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveSup(null)}
                className="rounded-xl border border-[#DCEAE3] px-4 py-2 text-sm font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#135D43] px-5 py-2 text-sm font-bold text-white hover:bg-[#0E4834]"
              >
                {saving ? 'Mengirim...' : 'Kirim Arahan ke Kader'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
}
