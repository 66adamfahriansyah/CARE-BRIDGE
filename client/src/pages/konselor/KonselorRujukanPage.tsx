import React, { useCallback, useEffect, useState } from 'react';
import type { ReferralRecord, ReferralStatus, SupportRequest } from '@shared/types';
import { Building2, Plus, Share2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { ReferralStatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { formatDateTime } from '@/utils/formatTime';

export function KonselorRujukanPage() {
  const { showToast } = useToast();

  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState('');
  const [facility, setFacility] = useState('RSUD dr. Zainoel Abidin (RSUDZA) Banda Aceh');
  const [refType, setRefType] = useState('Layanan Psikologi Klinis & Kesehatan Terpadu');
  const [summaryNote, setSummaryNote] = useState('');
  const [status, setStatus] = useState<ReferralStatus>('direncanakan');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [refRes, reqRes] = await Promise.all([api.referrals.list(), api.requests.list()]);
      setReferrals(refRes.referrals);
      setRequests(reqRes.requests);
      if (reqRes.requests.length > 0 && !selectedReqId) {
        setSelectedReqId(reqRes.requests[0].id);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat data rujukan.');
    } finally {
      setLoading(false);
    }
  }, [selectedReqId]);

  useEffect(() => {
    loadData();
    const onReset = () => loadData();
    window.addEventListener('cb:demo-reset', onReset);
    return () => window.removeEventListener('cb:demo-reset', onReset);
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqId || summaryNote.trim().length < 5) {
      showToast('Pilih kasus dan tulis catatan rujukan minimal 5 karakter', { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.referrals.create({
        requestId: selectedReqId,
        destinationFacility: facility,
        referralType: refType,
        summaryNote: summaryNote.trim(),
        status,
      });
      showToast('Rujukan berhasil dibuat');
      setCreateOpen(false);
      setSummaryNote('');
      await loadData();
    } catch (err) {
      showToast('Gagal mencatat rujukan', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (ref: ReferralRecord, nextStatus: ReferralStatus) => {
    try {
      await api.referrals.update(ref.id, { status: nextStatus });
      showToast(`Status rujukan ${ref.anonymousCode} diubah ke ${nextStatus}`);
      await loadData();
    } catch (err) {
      showToast('Gagal memperbarui status rujukan', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    }
  };

  return (
    <DashboardLayout
      title="Manajemen Rujukan Layanan"
      subtitle="Catat dan pantau rujukan terencana maupun terkonfirmasi ke rumah sakit atau puskesmas"
      onDemoReset={loadData}
    >
      <div className="space-y-5">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#135D43] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0E4834]"
          >
            <Plus className="h-4 w-4" />
            Buat Rujukan Baru
          </button>
        </div>

        {loading ? (
          <SkeletonRows rows={4} />
        ) : errorMsg ? (
          <ErrorState message={errorMsg} onRetry={loadData} />
        ) : referrals.length === 0 ? (
          <EmptyState
            title="Belum ada catatan rujukan"
            description="Tambahkan rujukan baru ketika kasus memerlukan layanan lanjutan di fasilitas kesehatan."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {referrals.map((ref) => (
              <div key={ref.id} className="cb-card flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#0E2D24]">
                        <Share2 className="h-4 w-4 text-[#0F766E]" />
                        {ref.anonymousCode}
                      </span>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[#135D43]">
                        <Building2 className="h-4 w-4 shrink-0" />
                        {ref.destinationFacility}
                      </p>
                    </div>
                    <ReferralStatusBadge status={ref.status} />
                  </div>

                  <p className="mt-1 text-xs font-semibold text-[#47655B]">{ref.referralType}</p>
                  <p className="mt-2 rounded-xl bg-[#F7FCF9] p-3 text-xs leading-relaxed text-[#28473D]">
                    {ref.summaryNote}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EAF2EE] pt-3 text-xs">
                  <span className="text-[#5B7A6F]">Diperbarui {formatDateTime(ref.updatedAt)}</span>
                  <div className="flex gap-2">
                    {ref.status === 'direncanakan' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ref, 'dikonfirmasi')}
                        className="rounded-lg bg-[#1D65C1] px-3 py-1.5 font-bold text-white hover:bg-[#174E96]"
                      >
                        Konfirmasi Rujukan
                      </button>
                    )}
                    {ref.status !== 'selesai' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ref, 'selesai')}
                        className="rounded-lg bg-[#135D43] px-3 py-1.5 font-bold text-white hover:bg-[#0E4834]"
                      >
                        Tandai Selesai
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Catat Rujukan Baru"
        description="Status kasus terkait akan otomatis diperbarui menjadi Menunggu Rujukan."
      >
        <form onSubmit={handleCreate} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">Pilih Kasus Penyintas</label>
            <select
              value={selectedReqId}
              onChange={(e) => setSelectedReqId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] bg-white px-3.5 py-2 text-sm"
            >
              {requests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.anonymousCode} — {r.primaryNeed} ({r.locationPost})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">Fasilitas Tujuan</label>
            <input
              type="text"
              required
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">Jenis Layanan</label>
            <input
              type="text"
              required
              value={refType}
              onChange={(e) => setRefType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">Status Rujukan</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReferralStatus)}
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] bg-white px-3.5 py-2 text-sm"
            >
              <option value="direncanakan">Direncanakan</option>
              <option value="dikonfirmasi">Dikonfirmasi</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">Ringkasan Rujukan</label>
            <textarea
              rows={3}
              required
              value={summaryNote}
              onChange={(e) => setSummaryNote(e.target.value)}
              placeholder="Alasan rujukan dan koordinasi serah terima..."
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] p-3 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-xl border border-[#DCEAE3] px-4 py-2 text-sm font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#135D43] px-4 py-2 text-sm font-bold text-white"
            >
              {saving ? 'Menyimpan...' : 'Simpan Rujukan'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
