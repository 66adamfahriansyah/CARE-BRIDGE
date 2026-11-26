import React, { useCallback, useEffect, useState } from 'react';
import type { KaderDashboardStats, SupportRequest } from '@shared/types';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  FilePlus2,
  Stethoscope,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/EmptyState';
import { KpiCard } from '@/components/KpiCard';
import { Modal } from '@/components/Modal';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { formatRelativeTime } from '@/utils/formatTime';

export function KaderDashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [stats, setStats] = useState<KaderDashboardStats | null>(null);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Quick follow-up modal & supervision modal directly from dashboard table
  const [noteTarget, setNoteTarget] = useState<SupportRequest | null>(null);
  const [noteText, setNoteText] = useState('');
  const [supTarget, setSupTarget] = useState<SupportRequest | null>(null);
  const [supType, setSupType] = useState<'terjadwal' | 'konsultasi_segera'>('terjadwal');
  const [supReason, setSupReason] = useState('');
  const [supSummary, setSupSummary] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [statsRes, reqRes] = await Promise.all([
        api.stats.kader(),
        api.requests.list(),
      ]);
      setStats(statsRes);
      setRequests(reqRes.requests);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat dashboard kader.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const onReset = () => loadData();
    window.addEventListener('cb:demo-reset', onReset);
    return () => window.removeEventListener('cb:demo-reset', onReset);
  }, [loadData]);

  const handleAccept = async (req: SupportRequest) => {
    setBusyId(req.id);
    try {
      await api.requests.accept(req.id);
      showToast(`Pendampingan ${req.anonymousCode} diterima`, {
        description: 'Status berubah menjadi Dalam Proses.',
      });
      await loadData();
    } catch (err) {
      showToast('Gagal menerima pendampingan', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTarget || noteText.trim().length < 5) {
      showToast('Catatan minimal 5 karakter', { variant: 'error' });
      return;
    }
    setBusyId(noteTarget.id);
    try {
      await api.requests.addFollowUp(noteTarget.id, { note: noteText.trim() });
      showToast(`Catatan tindak lanjut ${noteTarget.anonymousCode} disimpan`);
      setNoteTarget(null);
      setNoteText('');
      await loadData();
    } catch (err) {
      showToast('Gagal menyimpan catatan', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickSupervision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supTarget || supReason.trim().length < 5 || supSummary.trim().length < 5) {
      showToast('Alasan dan ringkasan minimal 5 karakter', { variant: 'error' });
      return;
    }
    setBusyId(supTarget.id);
    try {
      await api.supervisions.create({
        requestId: supTarget.id,
        supervisionType: supType,
        reason: supReason.trim(),
        kaderSummary: supSummary.trim(),
      });
      showToast(`Supervisi untuk ${supTarget.anonymousCode} diajukan ke konselor`, {
        description: 'Status permintaan diperbarui menjadi Perlu Supervisi.',
      });
      setSupTarget(null);
      setSupReason('');
      setSupSummary('');
      await loadData();
    } catch (err) {
      showToast('Gagal mengajukan supervisi', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const activeRows = requests.filter((r) => r.status !== 'selesai').slice(0, 6);

  return (
    <DashboardLayout
      title="Dashboard Kader Pendamping"
      subtitle="Ringkasan permintaan pendampingan komunitas & tindak lanjut posko (Data Simulasi)"
      onDemoReset={loadData}
    >
      {loading ? (
        <SkeletonRows rows={5} />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={loadData} />
      ) : (
        <div className="cb-step-enter space-y-6">
          {/* 4 KPI Summary Cards matching Panel 5 */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Permintaan Baru"
              value={stats?.permintaanBaru ?? 0}
              icon={FilePlus2}
              tone="blue"
            />
            <KpiCard
              label="Dalam Proses"
              value={stats?.dalamProses ?? 0}
              icon={Clock}
              tone="amber"
            />
            <KpiCard
              label="Perlu Supervisi"
              value={stats?.perluSupervisi ?? 0}
              icon={Stethoscope}
              tone="purple"
            />
            <KpiCard
              label="Selesai"
              value={stats?.selesai ?? 0}
              icon={CheckCircle2}
              tone="green"
            />
          </section>

          {/* Kader Caseload & Role Boundary Banner (ESAI.docx Paragraf 26 & 34, Lampiran 6) */}
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#CFE3D8] bg-[#F7FCF9] px-5 py-3.5 text-xs">
            <div className="space-y-0.5">
              <p className="font-bold text-[#0E2D24]">
                Batas Peran Kader &amp; Beban Dampingan
              </p>
              <p className="text-[#47655B]">
                Kader memberikan dukungan dasar (PFA) — bukan diagnosis atau terapi. Segera ajukan{' '}
                <strong>Konsultasi Segera</strong> jika muncul krisis akut atau melampaui dukungan
                dasar.
              </p>
            </div>
            <div className="rounded-xl border border-[#BFE3CF] bg-white px-3.5 py-2 font-bold text-[#135D43]">
              Dampingan Aktif Anda: {stats?.activeAssignedCount ?? 0} /{' '}
              {stats?.maxRecommendedCaseload ?? 5} kasus (batas simulasi)
            </div>
          </section>

          {/* Daftar Permintaan Pendampingan matching Panel 5 */}
          <section className="cb-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAF2EE] px-5 py-4">
              <div>
                <h2 className="text-base font-extrabold text-[#0E2D24] sm:text-lg">
                  Daftar Permintaan Pendampingan
                </h2>
                <p className="text-xs text-[#4F6E63]">
                  Menampilkan kasus dalam tanggung jawab pendampingan kader (tanpa diagnosis klinis).
                </p>
              </div>
              <Link
                to="/kader/pendampingan"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1D65C1] hover:underline"
              >
                Lihat Semua
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {activeRows.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Belum ada permintaan aktif"
                  description="Semua permintaan pendampingan saat ini telah ditangani atau selesai."
                  action={
                    <Link
                      to="/kader/riwayat"
                      className="rounded-xl bg-[#135D43] px-4 py-2 text-xs font-bold text-white"
                    >
                      Lihat Riwayat Selesai
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-[#EAF2EE] bg-[#F8FCFA] text-xs font-bold text-[#47655B]">
                    <tr>
                      <th className="px-5 py-3.5">Nama (Anonim)</th>
                      <th className="px-5 py-3.5">Kebutuhan</th>
                      <th className="px-5 py-3.5">Waktu</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFF6F2]">
                    {activeRows.map((req) => (
                      <tr key={req.id} className="hover:bg-[#F9FDFB]">
                        <td className="px-5 py-4">
                          <Link
                            to={`/kader/pendampingan/${req.id}`}
                            className="font-bold text-[#0E2D24] hover:text-[#135D43] hover:underline"
                          >
                            {req.anonymousCode}
                          </Link>
                          <div className="text-xs text-[#5B7A6F]">{req.locationPost}</div>
                        </td>
                        <td className="px-5 py-4 text-[#28473D]">
                          <div className="font-semibold">{req.primaryNeed}</div>
                          <div className="line-clamp-1 max-w-xs text-xs text-[#5B7A6F]">
                            {req.needSummary}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-[#5B7A6F]">
                          {formatRelativeTime(req.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {req.status === 'baru' && (
                              <button
                                type="button"
                                disabled={busyId === req.id}
                                onClick={() => handleAccept(req)}
                                className="rounded-lg bg-[#135D43] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0E4834] disabled:opacity-50"
                              >
                                Terima
                              </button>
                            )}
                            {req.status === 'dalam_proses' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNoteTarget(req);
                                    setNoteText('');
                                  }}
                                  className="rounded-lg border border-[#CFE3D8] bg-white px-3 py-1.5 text-xs font-bold text-[#135D43] hover:bg-[#EFF8F3]"
                                >
                                  Catat
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSupTarget(req);
                                    setSupReason('');
                                    setSupSummary('');
                                  }}
                                  className="rounded-lg border border-[#D8CEFA] bg-[#F8F5FF] px-3 py-1.5 text-xs font-bold text-[#6D28D9] hover:bg-[#EFE7FF]"
                                >
                                  Konsultasi
                                </button>
                              </>
                            )}
                            {req.status === 'perlu_supervisi' && (
                              <button
                                type="button"
                                onClick={() => navigate(`/kader/pendampingan/${req.id}`)}
                                className="rounded-lg border border-[#CFE3D8] bg-white px-3 py-1.5 text-xs font-bold text-[#28473D] hover:bg-[#EFF8F3]"
                              >
                                Detail Kasus
                              </button>
                            )}
                            <Link
                              to={`/kader/pendampingan/${req.id}`}
                              className="rounded-lg p-1.5 text-[#4F6E63] hover:bg-[#EFF8F3] hover:text-[#135D43]"
                              title="Buka detail pendampingan"
                            >
                              <ClipboardList className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Quick Follow-Up Modal */}
      <Modal
        open={Boolean(noteTarget)}
        onClose={() => setNoteTarget(null)}
        title={`Catat Tindak Lanjut — ${noteTarget?.anonymousCode ?? ''}`}
        description="Simpan catatan perkembangan pendampingan awal tanpa mencantumkan diagnosis klinis."
      >
        <form onSubmit={handleQuickFollowUp} className="space-y-4">
          <textarea
            rows={4}
            required
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Contoh: Telah menyapa penyintas di posko, membantu teknik napas tenang, dan menyepakati kunjungan ulang besok pagi."
            className="w-full rounded-xl border border-[#CFE3D8] p-3 text-sm text-[#0E2D24]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNoteTarget(null)}
              className="rounded-xl border border-[#DCEAE3] px-4 py-2 text-sm font-semibold text-[#47655B]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busyId === noteTarget?.id}
              className="rounded-xl bg-[#135D43] px-4 py-2 text-sm font-bold text-white hover:bg-[#0E4834]"
            >
              Simpan Catatan
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Supervision Modal */}
      <Modal
        open={Boolean(supTarget)}
        onClose={() => setSupTarget(null)}
        title={`Konsultasi Supervisi ke Konselor — ${supTarget?.anonymousCode ?? ''}`}
        description="Permintaan supervisi akan langsung masuk ke antrean Konselor Profesional."
      >
        <form onSubmit={handleQuickSupervision} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">
              Jenis Koordinasi Supervisi
            </label>
            <select
              value={supType}
              onChange={(e) =>
                setSupType(e.target.value as 'terjadwal' | 'konsultasi_segera')
              }
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] bg-white px-3 py-2 text-sm"
            >
              <option value="terjadwal">Supervisi Terjadwal (Diskusi Kasus &amp; Arahan)</option>
              <option value="konsultasi_segera">
                Konsultasi Segera (Masalah Keselamatan / Melampaui Dukungan Dasar)
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">
              Alasan Pengajuan Supervisi
            </label>
            <input
              type="text"
              required
              value={supReason}
              onChange={(e) => setSupReason(e.target.value)}
              placeholder="Contoh: Penyintas mengalami sulit tidur berat lebih dari 1 minggu"
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">
              Ringkasan Pendampingan Sejauh Ini
            </label>
            <textarea
              rows={3}
              required
              value={supSummary}
              onChange={(e) => setSupSummary(e.target.value)}
              placeholder="Tuliskan langkah awal yang sudah dilakukan kader..."
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] p-3 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSupTarget(null)}
              className="rounded-xl border border-[#DCEAE3] px-4 py-2 text-sm font-semibold text-[#47655B]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busyId === supTarget?.id}
              className="rounded-xl bg-[#6D28D9] px-4 py-2 text-sm font-bold text-white hover:bg-[#5B21B6]"
            >
              Kirim ke Konselor
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
