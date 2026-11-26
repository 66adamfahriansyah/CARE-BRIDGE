import React, { useCallback, useEffect, useState } from 'react';
import { SERVICE_TRACK_LABEL } from '@shared/status';
import type { SupportRequest, SupportRequestStatus } from '@shared/types';
import { ClipboardCheck, Search, Share2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { formatDateTime } from '@/utils/formatTime';

export function KonselorPermintaanPage() {
  const { showToast } = useToast();

  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [trackFilter, setTrackFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Selected case detail & action modal
  const [selected, setSelected] = useState<SupportRequest | null>(null);
  const [noteText, setNoteText] = useState('');
  const [nextStatus, setNextStatus] = useState<SupportRequestStatus>('dalam_proses');
  const [isCounselorOnly, setIsCounselorOnly] = useState(true);
  const [saving, setSaving] = useState(false);

  // Referral creation modal
  const [refTarget, setRefTarget] = useState<SupportRequest | null>(null);
  const [facility, setFacility] = useState('RSUD dr. Zainoel Abidin (RSUDZA) Banda Aceh');
  const [refType, setRefType] = useState('Layanan Psikologi Klinis & Kesehatan Terpadu');
  const [refNote, setRefNote] = useState('');
  const [refStatus, setRefStatus] = useState<'direncanakan' | 'dikonfirmasi'>('direncanakan');

  const loadList = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.requests.list({
        track: trackFilter,
        status: statusFilter,
        search,
      });
      setRequests(res.requests);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat daftar permintaan.');
    } finally {
      setLoading(false);
    }
  }, [trackFilter, statusFilter, search]);

  useEffect(() => {
    loadList();
    const onReset = () => loadList();
    window.addEventListener('cb:demo-reset', onReset);
    return () => window.removeEventListener('cb:demo-reset', onReset);
  }, [loadList]);

  const openDetail = async (req: SupportRequest) => {
    try {
      const res = await api.requests.getById(req.id);
      setSelected(res.request);
      setNextStatus(
        res.request.status === 'baru' ? 'dalam_proses' : res.request.status,
      );
      setNoteText('');
    } catch (err) {
      showToast('Gagal memuat detail kasus', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    }
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || noteText.trim().length < 5) {
      showToast('Ringkasan tindak lanjut minimal 5 karakter', { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.requests.addFollowUp(selected.id, {
        note: noteText.trim(),
        nextStatus: nextStatus === 'baru' ? 'dalam_proses' : nextStatus,
        isCounselorOnly,
      });
      showToast(`Tindak lanjut ${selected.anonymousCode} disimpan`);
      setSelected(null);
      await loadList();
    } catch (err) {
      showToast('Gagal menyimpan tindak lanjut', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refTarget || refNote.trim().length < 5) {
      showToast('Ringkasan rujukan minimal 5 karakter', { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.referrals.create({
        requestId: refTarget.id,
        destinationFacility: facility,
        referralType: refType,
        summaryNote: refNote.trim(),
        status: refStatus,
      });
      showToast(`Rujukan untuk ${refTarget.anonymousCode} berhasil dicatat`);
      setRefTarget(null);
      setRefNote('');
      await loadList();
    } catch (err) {
      showToast('Gagal membuat rujukan', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Permintaan Layanan Profesional"
      subtitle="Tinjau permintaan konseling, jalur bantuan segera, pembaruan status, dan rujukan"
      onDemoReset={loadList}
    >
      <div className="space-y-4">
        <div className="cb-card flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A837B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode pengguna, kebutuhan, atau lokasi posko..."
              className="w-full rounded-xl border border-[#CFE3D8] bg-[#F8FCFA] py-2 pl-9 pr-3 text-sm"
            />
          </div>

          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            aria-label="Filter jalur layanan"
            className="rounded-xl border border-[#CFE3D8] bg-white px-3 py-2 text-xs font-semibold"
          >
            <option value="all">Semua Jalur</option>
            <option value="konselor">Jalur Konselor</option>
            <option value="bantuan_segera">Bantuan Segera</option>
            <option value="kader">Jalur Kader</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status kasus"
            className="rounded-xl border border-[#CFE3D8] bg-white px-3 py-2 text-xs font-semibold"
          >
            <option value="all">Semua Status</option>
            <option value="baru">Baru</option>
            <option value="dalam_proses">Dalam Proses</option>
            <option value="perlu_supervisi">Perlu Supervisi</option>
            <option value="menunggu_rujukan">Menunggu Rujukan</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>

        {loading ? (
          <SkeletonRows rows={5} />
        ) : errorMsg ? (
          <ErrorState message={errorMsg} onRetry={loadList} />
        ) : requests.length === 0 ? (
          <EmptyState
            title="Tidak ada permintaan ditemukan"
            description="Ubah filter pencarian untuk melihat permintaan layanan lainnya."
          />
        ) : (
          <div className="cb-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-[#EAF2EE] bg-[#F8FCFA] text-xs font-bold text-[#47655B]">
                  <tr>
                    <th className="px-5 py-3.5">Identitas</th>
                    <th className="px-5 py-3.5">Jalur &amp; Kebutuhan</th>
                    <th className="px-5 py-3.5">Posko</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFF6F2]">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#F9FDFB]">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#0E2D24]">{req.anonymousCode}</div>
                        <div className="text-xs text-[#5B7A6F]">{req.displayName}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            req.serviceTrack === 'bantuan_segera'
                              ? 'bg-[#FDECEC] text-[#B42318]'
                              : req.serviceTrack === 'konselor'
                                ? 'bg-[#E6F7F5] text-[#0F766E]'
                                : 'bg-[#EFF8F3] text-[#135D43]'
                          }`}
                        >
                          {SERVICE_TRACK_LABEL[req.serviceTrack]}
                        </span>
                        <div className="mt-1 font-semibold text-[#0E2D24]">{req.primaryNeed}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#47655B]">{req.locationPost}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(req)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#135D43] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0E4834]"
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" />
                            Tinjau
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRefTarget(req);
                              setRefNote('');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#CFE3D8] bg-white px-3 py-1.5 text-xs font-bold text-[#135D43] hover:bg-[#EFF8F3]"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            Rujuk
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Review & Update Modal */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Tinjauan Konselor — ${selected?.anonymousCode ?? ''}`}
        description={selected?.locationPost}
        maxWidthClass="max-w-2xl"
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#DCEAE3] bg-[#F8FCFA] p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#0E2D24]">{selected.primaryNeed}</span>
                <StatusBadge status={selected.status} />
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#425F54]">
                {selected.needSummary}
              </p>
              <p className="mt-2 text-xs text-[#5B7A6F]">
                <strong>Kontak:</strong>{' '}
                {selected.contactAllowed && selected.contactInfo
                  ? selected.contactInfo
                  : 'Tidak dicantumkan'}
              </p>
              {selected.counselorFollowUpSummary && (
                <p className="mt-2 rounded-lg bg-[#EEF6FD] p-2.5 text-xs text-[#17467C]">
                  <strong>Ringkasan Konselor Terakhir:</strong> {selected.counselorFollowUpSummary}
                </p>
              )}
            </div>

            <form onSubmit={handleSaveFollowUp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0E2D24]">
                  Perbarui Status Kasus
                </label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as SupportRequestStatus)}
                  className="mt-1 w-full rounded-xl border border-[#CFE3D8] bg-white px-3.5 py-2 text-sm"
                >
                  <option value="dalam_proses">Dalam Proses</option>
                  <option value="perlu_supervisi">Perlu Supervisi</option>
                  <option value="menunggu_rujukan">Menunggu Rujukan</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E2D24]">
                  Ringkasan Tindak Lanjut Sesuai Kewenangan
                </label>
                <textarea
                  rows={3}
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Catat hasil sesi konseling awal, rencana tindak lanjut, atau koordinasi layanan..."
                  className="mt-1 w-full rounded-xl border border-[#CFE3D8] p-3 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-[#2E5245]">
                <input
                  type="checkbox"
                  checked={isCounselorOnly}
                  onChange={(e) => setIsCounselorOnly(e.target.checked)}
                  className="h-4 w-4 accent-[#135D43]"
                />
                Batasi catatan ini hanya untuk konselor (tidak ditampilkan di layar kader)
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-xl border border-[#DCEAE3] px-4 py-2 text-sm font-semibold text-[#47655B]"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#135D43] px-5 py-2 text-sm font-bold text-white hover:bg-[#0E4834]"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Pembaruan'}
                </button>
              </div>
            </form>

            {(selected.followUps?.length ?? 0) > 0 && (
              <div className="border-t border-[#EAF2EE] pt-3">
                <p className="mb-2 text-xs font-bold text-[#47655B]">Riwayat Perubahan &amp; Catatan</p>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {selected.followUps?.map((fu) => (
                    <div key={fu.id} className="rounded-lg bg-[#F7FCF9] p-2.5 text-xs">
                      <div className="flex justify-between font-semibold text-[#135D43]">
                        <span>
                          {fu.authorName} {fu.isCounselorOnly ? '(Rahasia Konselor)' : ''}
                        </span>
                        <span className="text-[#6A837B]">{formatDateTime(fu.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-[#2E4D42]">{fu.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Referral Modal */}
      <Modal
        open={Boolean(refTarget)}
        onClose={() => setRefTarget(null)}
        title={`Catat Rujukan Layanan — ${refTarget?.anonymousCode ?? ''}`}
        description="Rujukan akan muncul di modul Rujukan dan memperbarui status kasus."
      >
        <form onSubmit={handleCreateReferral} className="space-y-3.5">
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
            <label className="block text-xs font-bold text-[#0E2D24]">Jenis Layanan Rujukan</label>
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
              value={refStatus}
              onChange={(e) =>
                setRefStatus(e.target.value as 'direncanakan' | 'dikonfirmasi')
              }
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] bg-white px-3.5 py-2 text-sm"
            >
              <option value="direncanakan">Direncanakan</option>
              <option value="dikonfirmasi">Dikonfirmasi</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">Catatan Rujukan</label>
            <textarea
              rows={3}
              required
              value={refNote}
              onChange={(e) => setRefNote(e.target.value)}
              placeholder="Ringkasan koordinasi rujukan..."
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] p-3 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRefTarget(null)}
              className="rounded-xl border border-[#DCEAE3] px-4 py-2 text-sm font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#135D43] px-4 py-2 text-sm font-bold text-white hover:bg-[#0E4834]"
            >
              Simpan Rujukan
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
