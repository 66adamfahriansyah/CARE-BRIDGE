import React, { useCallback, useEffect, useState } from 'react';
import type { AuditEvent, SupportRequest, SupportRequestStatus } from '@shared/types';
import { CheckCircle2, ClipboardCheck, History } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { formatDateTime } from '@/utils/formatTime';

export function KonselorTindakLanjutPage() {
  const { showToast } = useToast();

  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [editing, setEditing] = useState<SupportRequest | null>(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<SupportRequestStatus>('dalam_proses');
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [reqRes, auditRes] = await Promise.all([api.requests.list(), api.stats.audit()]);
      setRequests(
        reqRes.requests.filter(
          (r) => r.status !== 'selesai' && r.status !== 'baru',
        ),
      );
      setAuditEvents(auditRes.events);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat tindak lanjut.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const onReset = () => loadAll();
    window.addEventListener('cb:demo-reset', onReset);
    return () => window.removeEventListener('cb:demo-reset', onReset);
  }, [loadAll]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || note.trim().length < 5) {
      showToast('Catatan minimal 5 karakter', { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.requests.addFollowUp(editing.id, {
        note: note.trim(),
        nextStatus: status === 'baru' ? 'dalam_proses' : status,
        isCounselorOnly: false,
      });
      showToast(`Tindak lanjut ${editing.anonymousCode} berhasil diperbarui`);
      setEditing(null);
      setNote('');
      await loadAll();
    } catch (err) {
      showToast('Gagal menyimpan tindak lanjut', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Tindak Lanjut Kasus & Riwayat Status"
      subtitle="Pantau kasus berjalan, perbarui ringkasan tindak lanjut, dan tinjau jejak perubahan status"
      onDemoReset={loadAll}
    >
      {loading ? (
        <SkeletonRows rows={5} />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={loadAll} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Active Follow-up Cases */}
          <div className="space-y-4 lg:col-span-7">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-[#0E2D24]">
              <ClipboardCheck className="h-5 w-5 text-[#135D43]" />
              Kasus Membutuhkan Pemantauan Tindak Lanjut ({requests.length})
            </h2>

            {requests.length === 0 ? (
              <EmptyState
                title="Tidak ada kasus tindak lanjut aktif"
                description="Semua kasus yang berjalan telah selesai atau menunggu penerimaan awal."
              />
            ) : (
              requests.map((req) => (
                <div key={req.id} className="cb-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#0E2D24]">{req.anonymousCode}</span>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#135D43]">{req.primaryNeed}</p>
                      <p className="text-xs text-[#5B7A6F]">{req.locationPost}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(req);
                        setStatus(req.status);
                        setNote('');
                      }}
                      className="rounded-xl bg-[#135D43] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0E4834]"
                    >
                      Perbarui Tindak Lanjut
                    </button>
                  </div>

                  {req.counselorFollowUpSummary && (
                    <p className="mt-3 rounded-xl bg-[#F4FAF6] p-3 text-xs text-[#28473D]">
                      <strong>Ringkasan terakhir:</strong> {req.counselorFollowUpSummary}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Audit / Status Change Timeline */}
          <div className="lg:col-span-5">
            <div className="cb-card p-5">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-[#0E2D24]">
                <History className="h-5 w-5 text-[#1D65C1]" />
                Riwayat Perubahan &amp; Aktivitas Sistem
              </h2>
              <div className="mt-4 max-h-[540px] space-y-3 overflow-y-auto pr-1">
                {auditEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-[#EAF2EE] bg-[#F9FDFB] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 font-bold text-[#135D43]">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {ev.actorName}
                      </span>
                      <span className="text-[11px] font-medium text-[#6A837B]">
                        {formatDateTime(ev.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-[#28473D]">{ev.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Catat Tindak Lanjut — ${editing?.anonymousCode ?? ''}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">Status Kasus</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SupportRequestStatus)}
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] bg-white px-3.5 py-2 text-sm"
            >
              <option value="dalam_proses">Dalam Proses</option>
              <option value="perlu_supervisi">Perlu Supervisi</option>
              <option value="menunggu_rujukan">Menunggu Rujukan</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">Catatan Tindak Lanjut</label>
            <textarea
              rows={4}
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tuliskan perkembangan tindak lanjut..."
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] p-3 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-xl border border-[#DCEAE3] px-4 py-2 text-sm font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#135D43] px-4 py-2 text-sm font-bold text-white"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
