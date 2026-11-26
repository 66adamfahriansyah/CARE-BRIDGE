import React, { useCallback, useEffect, useState } from 'react';
import type { SupportRequest } from '@shared/types';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  MessageSquarePlus,
  Phone,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ErrorState, SkeletonRows } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { StatusBadge, SupervisionStatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { formatDateTime } from '@/utils/formatTime';

export function KaderPendampinganDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [request, setRequest] = useState<SupportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Follow-up form
  const [followUpNote, setFollowUpNote] = useState('');

  // Supervision form
  const [supModalOpen, setSupModalOpen] = useState(false);
  const [supType, setSupType] = useState<'terjadwal' | 'konsultasi_segera'>('terjadwal');
  const [supReason, setSupReason] = useState('');
  const [supSummary, setSupSummary] = useState('');

  // Complete confirmation modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [closingNote, setClosingNote] = useState('');

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.requests.getById(id);
      setRequest(res.request);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat detail kasus.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleAccept = async () => {
    if (!request) return;
    setSubmitting(true);
    try {
      await api.requests.accept(request.id);
      showToast('Pendampingan diterima — Status menjadi Dalam Proses');
      await loadDetail();
    } catch (err) {
      showToast('Gagal menerima permintaan', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || followUpNote.trim().length < 5) {
      showToast('Catatan tindak lanjut minimal 5 karakter', { variant: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await api.requests.addFollowUp(request.id, {
        note: followUpNote.trim(),
      });
      setFollowUpNote('');
      showToast('Catatan tindak lanjut berhasil disimpan');
      await loadDetail();
    } catch (err) {
      showToast('Gagal menyimpan catatan', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestSupervision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || supReason.trim().length < 5 || supSummary.trim().length < 5) {
      showToast('Isi alasan dan ringkasan minimal 5 karakter', { variant: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await api.supervisions.create({
        requestId: request.id,
        supervisionType: supType,
        reason: supReason.trim(),
        kaderSummary: supSummary.trim(),
      });
      setSupModalOpen(false);
      setSupReason('');
      setSupSummary('');
      showToast('Permintaan supervisi dikirim ke Konselor Profesional');
      await loadDetail();
    } catch (err) {
      showToast('Gagal mengajukan supervisi', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || closingNote.trim().length < 5) {
      showToast('Catatan penyelesaian minimal 5 karakter', { variant: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await api.requests.complete(request.id, closingNote.trim());
      setCompleteModalOpen(false);
      setClosingNote('');
      showToast('Pendampingan ditandai Selesai dan disimpan ke riwayat');
      await loadDetail();
    } catch (err) {
      showToast('Gagal menyelesaikan pendampingan', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title={request ? `Detail Pendampingan — ${request.anonymousCode}` : 'Detail Pendampingan'}
      subtitle="Data terbatas sesuai kewenangan kader (tanpa diagnosis klinis atau catatan rahasia konselor)"
      onDemoReset={loadDetail}
    >
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/kader/pendampingan')}
          className="inline-flex items-center gap-2 rounded-xl border border-[#DCEAE3] bg-white px-4 py-2 text-xs font-bold text-[#135D43] hover:bg-[#EFF8F3]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Pendampingan
        </button>

        {loading ? (
          <SkeletonRows rows={5} />
        ) : errorMsg || !request ? (
          <ErrorState message={errorMsg || 'Kasus tidak ditemukan.'} onRetry={loadDetail} />
        ) : (
          <div className="cb-step-enter grid gap-6 lg:grid-cols-12">
            {/* Left Case Overview & Actions */}
            <div className="space-y-5 lg:col-span-7">
              <div className="cb-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EAF2EE] pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-extrabold text-[#0E2D24]">
                        {request.anonymousCode}
                      </h2>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="mt-1 text-xs text-[#5B7A6F]">
                      Identitas tampilan: <strong>{request.displayName}</strong> • Rentang usia:{' '}
                      {request.ageRange}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {request.status === 'baru' && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleAccept}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#135D43] px-4 py-2 text-xs font-bold text-white hover:bg-[#0E4834]"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        Terima Pendampingan
                      </button>
                    )}

                    {request.status !== 'selesai' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSupModalOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8CEFA] bg-[#F8F5FF] px-3.5 py-2 text-xs font-bold text-[#6D28D9] hover:bg-[#EFE7FF]"
                        >
                          <Stethoscope className="h-4 w-4" />
                          Konsultasikan ke Konselor
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompleteModalOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#BFE3CF] bg-[#ECF8F1] px-3.5 py-2 text-xs font-bold text-[#135D43] hover:bg-[#DCF0E4]"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Tandai Selesai
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1B8A5A]" />
                    <div>
                      <dt className="text-xs font-bold text-[#5B7A6F]">Lokasi Posko</dt>
                      <dd className="font-semibold text-[#0E2D24]">{request.locationPost}</dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#1B8A5A]" />
                    <div>
                      <dt className="text-xs font-bold text-[#5B7A6F]">Kontak Tindak Lanjut</dt>
                      <dd className="font-medium text-[#0E2D24]">
                        {request.contactAllowed && request.contactInfo
                          ? request.contactInfo
                          : 'Penyintas tidak mencantumkan kontak'}
                      </dd>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#F7FCF9] p-4">
                    <dt className="text-xs font-bold uppercase text-[#2E5E4B]">
                      Kebutuhan &amp; Kondisi Non-Klinis
                    </dt>
                    <dd className="mt-1 font-bold text-[#0E2D24]">{request.primaryNeed}</dd>
                    <dd className="mt-1 text-xs leading-relaxed text-[#425F54]">
                      {request.needSummary}
                    </dd>
                    <div className="mt-2 grid gap-2 border-t border-[#E3EFE8] pt-2 text-xs text-[#4F6E63] sm:grid-cols-2">
                      <div>
                        <strong>Aktivitas:</strong> {request.activityDifficulty}
                      </div>
                      <div>
                        <strong>Dukungan sosial:</strong> {request.socialSupportInfo}
                      </div>
                    </div>
                  </div>
                </dl>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#EFF8F3] px-3.5 py-2.5 text-xs font-medium text-[#135D43]">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>
                    Batas kewenangan aktif: catatan konseling profesional tidak ditampilkan pada
                    tampilan kader.
                  </span>
                </div>
              </div>

              {/* Arahan Supervisi dari Konselor */}
              {(request.supervisionGuidance || (request.supervisions?.length ?? 0) > 0) && (
                <div className="cb-card border-[#D8CEFA] bg-[#FBF9FF] p-5">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-[#5B21B6]">
                    <Stethoscope className="h-4.5 w-4.5" />
                    Arahan &amp; Riwayat Supervisi Konselor
                  </div>

                  {request.supervisionGuidance && (
                    <div className="mt-3 rounded-xl border border-[#E4D3FF] bg-white p-4 text-sm text-[#1F1535]">
                      <p className="text-xs font-bold uppercase text-[#6D28D9]">
                        Arahan Terbaru dari Konselor:
                      </p>
                      <p className="mt-1 leading-relaxed">{request.supervisionGuidance}</p>
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
                    {request.supervisions?.map((sup) => (
                      <div
                        key={sup.id}
                        className="rounded-xl border border-[#ECE4FA] bg-white p-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-[#0E2D24]">{sup.reason}</span>
                          <SupervisionStatusBadge status={sup.status} />
                        </div>
                        <p className="mt-1 text-[#4F6E63]">Ringkasan kader: {sup.kaderSummary}</p>
                        {sup.counselorGuidance && (
                          <p className="mt-1.5 rounded-lg bg-[#F4EEFF] p-2 font-medium text-[#4C1D95]">
                            Arahan ({sup.counselorName}): {sup.counselorGuidance}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Follow-Up Form & Timeline */}
            <div className="space-y-5 lg:col-span-5">
              {request.status !== 'selesai' && (
                <div className="cb-card p-5">
                  <h3 className="flex items-center gap-2 text-base font-extrabold text-[#0E2D24]">
                    <MessageSquarePlus className="h-4.5 w-4.5 text-[#135D43]" />
                    Catat Tindak Lanjut Kader
                  </h3>
                  <form onSubmit={handleAddFollowUp} className="mt-3 space-y-3">
                    <textarea
                      rows={4}
                      required
                      value={followUpNote}
                      onChange={(e) => setFollowUpNote(e.target.value)}
                      placeholder="Tuliskan kegiatan pendampingan, respons penyintas, atau rencana kunjungan berikutnya..."
                      className="w-full rounded-xl border border-[#CFE3D8] bg-[#FAFDFB] p-3 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-xl bg-[#135D43] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0E4834] disabled:opacity-60"
                    >
                      Simpan Catatan Tindak Lanjut
                    </button>
                  </form>
                </div>
              )}

              <div className="cb-card p-5">
                <h3 className="text-base font-extrabold text-[#0E2D24]">
                  Riwayat Tindak Lanjut ({request.followUps?.length ?? 0})
                </h3>
                <div className="mt-4 space-y-3">
                  {(request.followUps?.length ?? 0) === 0 ? (
                    <p className="text-xs text-[#5B7A6F]">
                      Belum ada catatan tindak lanjut pada kasus ini.
                    </p>
                  ) : (
                    request.followUps?.map((fu) => (
                      <div
                        key={fu.id}
                        className="rounded-xl border border-[#E6F1EB] bg-[#F9FDFB] p-3.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#135D43]">
                            {fu.authorName} ({fu.authorRole})
                          </span>
                          <span className="text-[11px] text-[#6A837B]">
                            {formatDateTime(fu.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1.5 leading-relaxed text-[#223F35]">{fu.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Request Supervision Modal */}
      <Modal
        open={supModalOpen}
        onClose={() => setSupModalOpen(false)}
        title="Konsultasikan Kasus ke Konselor Profesional"
        description="Status permintaan akan berubah menjadi Perlu Supervisi dan muncul di antrean konselor."
      >
        <form onSubmit={handleRequestSupervision} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">
              Jenis Supervisi
            </label>
            <select
              value={supType}
              onChange={(e) =>
                setSupType(e.target.value as 'terjadwal' | 'konsultasi_segera')
              }
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] bg-white px-3 py-2 text-sm"
            >
              <option value="terjadwal">Supervisi Terjadwal</option>
              <option value="konsultasi_segera">
                Konsultasi Segera (Keselamatan / Melampaui Dukungan Dasar)
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
              placeholder="Contoh: Membutuhkan arahan lanjutan karena penyintas masih sangat cemas"
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">
              Ringkasan Pendampingan Kader
            </label>
            <textarea
              rows={3}
              required
              value={supSummary}
              onChange={(e) => setSupSummary(e.target.value)}
              placeholder="Jelaskan pendekatan awal yang telah dilakukan dan hal yang ingin dikonsultasikan..."
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] p-3 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSupModalOpen(false)}
              className="rounded-xl border border-[#DCEAE3] px-4 py-2 text-sm font-semibold text-[#47655B]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#6D28D9] px-4 py-2 text-sm font-bold text-white hover:bg-[#5B21B6]"
            >
              Kirim Permintaan Supervisi
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Confirmation Modal */}
      <Modal
        open={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Konfirmasi Penyelesaian Pendampingan"
        description="Pastikan seluruh tindak lanjut awal telah dilakukan sebelum menandai selesai."
      >
        <form onSubmit={handleComplete} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">
              Ringkasan Penutupan Pendampingan
            </label>
            <textarea
              rows={3}
              required
              value={closingNote}
              onChange={(e) => setClosingNote(e.target.value)}
              placeholder="Contoh: Penyintas telah merasa lebih tenang, memiliki dukungan keluarga, dan memahami akses layanan."
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] p-3 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCompleteModalOpen(false)}
              className="rounded-xl border border-[#DCEAE3] px-4 py-2 text-sm font-semibold text-[#47655B]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#135D43] px-4 py-2 text-sm font-bold text-white hover:bg-[#0E4834]"
            >
              Konfirmasi &amp; Tandai Selesai
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
