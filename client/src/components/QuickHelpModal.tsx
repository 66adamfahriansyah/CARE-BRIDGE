import React, { useEffect, useState } from 'react';
import { ACEH_POSKO_LOCATIONS } from '@shared/status';
import { CheckCircle2, HeartHandshake, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { EscalationBanner } from './EscalationBanner';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';

const QUICK_NEEDS = [
  'Butuh teman bicara yang menenangkan',
  'Merasa cemas atau sulit tidur setelah bencana',
  'Butuh pendampingan keluarga / anak di posko',
  'Membutuhkan arahan ke layanan profesional',
];

export function QuickHelpModal({
  open,
  onClose,
  defaultTrack = 'kader',
  initialLocationPost,
  initialPrimaryNeed,
}: {
  open: boolean;
  onClose: () => void;
  defaultTrack?: 'kader' | 'konselor' | 'bantuan_segera';
  initialLocationPost?: string;
  initialPrimaryNeed?: string;
}) {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isAnonymous, setIsAnonymous] = useState(true);
  const [nickname, setNickname] = useState('');
  const [locationPost, setLocationPost] = useState<string>(
    initialLocationPost || ACEH_POSKO_LOCATIONS[0],
  );
  const [primaryNeed, setPrimaryNeed] = useState(initialPrimaryNeed || QUICK_NEEDS[0]);
  const [preferredTrack, setPreferredTrack] = useState<'kader' | 'konselor' | 'bantuan_segera'>(
    defaultTrack,
  );

  useEffect(() => {
    if (open) {
      setPreferredTrack(defaultTrack);
      if (initialLocationPost) setLocationPost(initialLocationPost);
      if (initialPrimaryNeed) setPrimaryNeed(initialPrimaryNeed);
    }
  }, [open, defaultTrack, initialLocationPost, initialPrimaryNeed]);
  const [agreedFollowUpContact, setAgreedFollowUpContact] = useState(false);
  const [contactInfo, setContactInfo] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const resetForm = () => {
    setIsAnonymous(true);
    setNickname('');
    setLocationPost(ACEH_POSKO_LOCATIONS[0]);
    setPrimaryNeed(QUICK_NEEDS[0]);
    setPreferredTrack(defaultTrack);
    setAgreedFollowUpContact(false);
    setContactInfo('');
    setConsentGiven(false);
    setErrorMsg('');
    setSubmittedCode(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isAnonymous && nickname.trim().length < 2) {
      setErrorMsg('Masukkan nama panggilan minimal 2 karakter atau pilih mode anonim.');
      return;
    }
    if (agreedFollowUpContact && contactInfo.trim().length < 4) {
      setErrorMsg('Isi cara menghubungi Anda (mis. nomor posko/tenda) jika menyetujui kontak.');
      return;
    }
    if (!consentGiven) {
      setErrorMsg('Centang persetujuan agar permintaan dapat diteruskan ke antrean layanan.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.screening.submitQuickHelp({
        isAnonymous,
        nickname,
        locationPost,
        primaryNeed,
        preferredTrack,
        agreedFollowUpContact,
        contactInfo,
        consentGiven: true,
      });

      setSubmittedCode(res.request.anonymousCode);
      showToast('Permintaan pendampingan tercatat', {
        description: `Kode anonim Anda: ${res.request.anonymousCode}. Permintaan telah masuk ke antrean prototipe.`,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengirim permintaan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Minta Pendampingan Tanpa Skrining"
      description="Anda tidak harus mengisi skrining panjang untuk meminta bantuan kader atau konselor."
      maxWidthClass="max-w-xl"
    >
      {submittedCode ? (
        <div className="space-y-4 py-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F7EE] text-[#135D43]">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-extrabold text-[#0E2D24]">Permintaan Anda Telah Tercatat</h3>
          <p className="text-sm text-[#47655B]">
            Simpan kode anonim simulasi ini: <strong className="text-[#135D43]">{submittedCode}</strong>.
            Permintaan Anda sudah langsung muncul pada dashboard{' '}
            {preferredTrack === 'kader' ? 'Kader Pendamping' : 'Konselor Profesional'} dengan status{' '}
            <strong>Baru</strong>.
          </p>
          {preferredTrack === 'bantuan_segera' && <EscalationBanner compact />}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                handleClose();
                navigate('/informasi');
              }}
              className="rounded-xl border border-[#DCEAE3] bg-white px-4 py-2.5 text-sm font-semibold text-[#135D43] hover:bg-[#EFF8F3]"
            >
              Baca Materi Menenangkan Diri
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl bg-[#135D43] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0E4834]"
            >
              Tutup
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {preferredTrack === 'bantuan_segera' && <EscalationBanner compact />}

          <div>
            <label className="block text-sm font-semibold text-[#0E2D24]">
              Jenis Bantuan yang Diinginkan
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(
                [
                  { id: 'kader', label: 'Kader Pendamping' },
                  { id: 'konselor', label: 'Konselor Profesional' },
                  { id: 'bantuan_segera', label: 'Bantuan Segera' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPreferredTrack(opt.id)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${
                    preferredTrack === opt.id
                      ? opt.id === 'bantuan_segera'
                        ? 'border-[#D92D20] bg-[#FFF0F0] text-[#B42318]'
                        : 'border-[#135D43] bg-[#E8F6EE] text-[#135D43]'
                      : 'border-[#DCEAE3] bg-white text-[#47655B] hover:bg-[#F5FBF8]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#DCEAE3] bg-[#F7FCF9] p-3.5">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-[#0E2D24]">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 accent-[#135D43]"
              />
              Tetap Anonim (tanpa nama, sistem memberi kode anonim otomatis)
            </label>
            {!isAnonymous && (
              <div className="mt-2.5">
                <label className="block text-xs font-semibold text-[#47655B]">
                  Nama Panggilan (Opsional, bukan nama lengkap/NIK)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Contoh: Ibu Aisyah / Bang Adi"
                  className="mt-1 w-full rounded-xl border border-[#CFE3D8] bg-white px-3.5 py-2 text-sm text-[#0E2D24]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0E2D24]">
              Lokasi Posko atau Wilayah
            </label>
            <select
              value={locationPost}
              onChange={(e) => setLocationPost(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#CFE3D8] bg-white px-3.5 py-2.5 text-sm text-[#0E2D24]"
            >
              {ACEH_POSKO_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0E2D24]">
              Kebutuhan Utama Saat Ini
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {QUICK_NEEDS.map((need) => (
                <button
                  key={need}
                  type="button"
                  onClick={() => setPrimaryNeed(need)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    primaryNeed === need
                      ? 'border-[#135D43] bg-[#135D43] text-white'
                      : 'border-[#DCEAE3] bg-white text-[#47655B] hover:bg-[#EFF8F3]'
                  }`}
                >
                  {need}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={primaryNeed}
              onChange={(e) => setPrimaryNeed(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#CFE3D8] bg-white px-3.5 py-2 text-sm text-[#0E2D24]"
              placeholder="Atau tuliskan singkat kebutuhan Anda..."
            />
          </div>

          <div className="rounded-xl border border-[#DCEAE3] bg-[#F7FCF9] p-3.5">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-[#0E2D24]">
              <input
                type="checkbox"
                checked={agreedFollowUpContact}
                onChange={(e) => setAgreedFollowUpContact(e.target.checked)}
                className="h-4 w-4 accent-[#135D43]"
              />
              Saya bersedia dicatat cara menghubunginya untuk tindak lanjut
            </label>
            {agreedFollowUpContact && (
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Contoh: Tenda B2 / Nomor HP atau WA simulasi"
                className="mt-2 w-full rounded-xl border border-[#CFE3D8] bg-white px-3.5 py-2 text-sm text-[#0E2D24]"
              />
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#CFE3D8] bg-[#EFF8F3] p-3 text-xs font-medium text-[#114432]">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#135D43]"
            />
            <span>
              Saya memahami ini adalah prototipe demonstrasi dan setuju permintaan ini diteruskan ke
              antrean layanan CARE BRIDGE secara rahasia.
            </span>
          </label>

          {errorMsg && (
            <p role="alert" className="rounded-xl bg-[#FDECEC] px-3.5 py-2 text-xs font-semibold text-[#C93434]">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[#EAF2EE] pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-[#DCEAE3] bg-white px-4 py-2.5 text-sm font-semibold text-[#47655B] hover:bg-[#F5FBF8]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#135D43] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0E4834] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <HeartHandshake className="h-4 w-4" />
                  Kirim Permintaan Pendamping
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
