import { useState } from 'react';
import type { DecisionResult, ScreeningInput } from '@shared/types';
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  GitBranch,
  Headphones,
  Home,
  Info,
  RotateCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BotanicalCorners, BrandLogo } from '@/components/BrandLogo';
import { EscalationBanner } from '@/components/EscalationBanner';
import { PrototypeBanner } from '@/components/PrototypeBanner';
import { QuickHelpModal } from '@/components/QuickHelpModal';
import { StatusBadge } from '@/components/StatusBadge';
import { SCREENING_DRAFT_KEY, SCREENING_RESULT_KEY } from '@/context/KioskContext';

interface StoredScreeningResult {
  sessionId: string;
  anonymousCode: string;
  decision: DecisionResult;
  inputSnapshot?: ScreeningInput;
  createdRequest: {
    id: string;
    anonymousCode: string;
    status: 'baru';
    serviceTrack: string;
  } | null;
}

export function ScreeningResultPage() {
  const navigate = useNavigate();
  const [quickHelpOpen, setQuickHelpOpen] = useState(false);
  const [quickTrack, setQuickTrack] = useState<'kader' | 'konselor'>('kader');

  const stored: StoredScreeningResult | null = (() => {
    try {
      const raw = sessionStorage.getItem(SCREENING_RESULT_KEY);
      return raw ? (JSON.parse(raw) as StoredScreeningResult) : null;
    } catch {
      return null;
    }
  })();

  const handleEditAndRecalculate = () => {
    if (stored?.inputSnapshot) {
      sessionStorage.setItem(SCREENING_DRAFT_KEY, JSON.stringify(stored.inputSnapshot));
    }
    navigate('/skrining');
  };

  if (!stored) {
    return (
      <div className="relative flex min-h-screen flex-col bg-[#F3FAF6]">
        <PrototypeBanner />
        <BotanicalCorners />
        <header className="relative z-10 border-b border-[#DCEAE3] bg-white/95">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link to="/">
              <BrandLogo compact />
            </Link>
            <Link
              to="/"
              aria-label="Kembali ke beranda"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCEAE3] bg-[#EFF8F3] text-[#135D43]"
            >
              <Home className="h-5 w-5" />
            </Link>
          </div>
        </header>
        <main className="relative z-10 mx-auto flex max-w-xl flex-1 items-center px-4 py-12">
          <div className="cb-card-elevated w-full p-8 text-center">
            <h1 className="text-xl font-extrabold text-[#0E2D24]">
              Belum Ada Hasil Skrining Aktif
            </h1>
            <p className="mt-2 text-sm text-[#47655B]">
              Silakan lengkapi skrining terlebih dahulu agar sistem dapat memproses jawaban Anda
              dan menyusun rekomendasi dukungan yang sesuai, atau minta bantuan petugas secara
              langsung.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/skrining"
                className="rounded-xl bg-[#135D43] px-5 py-2.5 text-sm font-bold text-white"
              >
                Mulai Skrining
              </Link>
              <button
                type="button"
                onClick={() => setQuickHelpOpen(true)}
                className="rounded-xl border border-[#CFE3D8] bg-white px-5 py-2.5 text-sm font-bold text-[#135D43]"
              >
                Minta Pendamping Langsung
              </button>
            </div>
          </div>
        </main>
        <QuickHelpModal open={quickHelpOpen} onClose={() => setQuickHelpOpen(false)} />
      </div>
    );
  }

  const { decision } = stored;

  return (
    <div className="relative flex min-h-screen flex-col bg-[#F3FAF6]">
      <PrototypeBanner />
      <BotanicalCorners />

      <header className="relative z-10 border-b border-[#DCEAE3] bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/">
            <BrandLogo compact />
          </Link>
          <Link
            to="/"
            aria-label="Kembali ke beranda"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCEAE3] bg-[#EFF8F3] text-[#135D43] hover:bg-[#DCEFE4]"
          >
            <Home className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {decision.isImmediateHelp && (
          <div className="mb-6">
            <EscalationBanner hideBantuanLink={false} />
          </div>
        )}

        <div className="cb-card-elevated cb-step-enter p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left Analysis & Traceability Column */}
            <div className="space-y-5 lg:col-span-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1B8A5A] text-white shadow-sm">
                  <Check className="h-7 w-7 stroke-[2.5]" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold leading-tight text-[#0E2D24]">
                    Terima kasih telah melengkapi skrining.
                  </h1>
                  <p className="mt-1.5 text-sm text-[#47655B]">
                    Berikut hasil analisis berbasis aturan (rule-based) berdasarkan jawaban yang
                    Anda berikan.
                  </p>
                </div>
              </div>

              {/* Ringkasan Kebutuhan & Status */}
              <div className="rounded-2xl border border-[#C6E5D4] bg-[#ECF8F1] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#135D43] shadow-2xs">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#2A5E4A]">
                      Rekomendasi Jalur Dukungan
                    </p>
                    <p className="text-base font-extrabold text-[#0E2D24]">
                      {decision.summaryTitle}
                    </p>
                    <p className="text-xs leading-relaxed text-[#27463C]">
                      {decision.summaryDescription}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#CBE7D8] pt-3 text-xs">
                  <span className="font-semibold text-[#135D43]">
                    Kode Anonim: <strong>{stored.anonymousCode}</strong>
                  </span>
                  {stored.createdRequest ? (
                    <StatusBadge status={stored.createdRequest.status} />
                  ) : (
                    <span className="rounded-full bg-white px-2.5 py-0.5 font-semibold text-[#47655B]">
                      Tidak mengirim antrean (jalur mandiri)
                    </span>
                  )}
                </div>
              </div>

              {/* Penelusuran Aturan & Alasan */}
              <div className="space-y-3 rounded-2xl border border-[#DCEAE3] bg-[#F8FCFA] p-4">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#135D43]">
                  <GitBranch className="h-4 w-4" />
                  Alasan &amp; Penelusuran Rekomendasi
                </div>
                <p className="text-xs leading-relaxed text-[#28473D]">{decision.reasoningSummary}</p>

                {decision.matchedRules.map((rule) => (
                  <div
                    key={rule.code}
                    className="rounded-xl border border-[#DCEAE3] bg-white p-3 text-xs"
                  >
                    <p className="font-bold text-[#0E2D24]">
                      {rule.label}{' '}
                      <span className="font-mono text-[11px] text-[#5B7A6F]">({rule.code})</span>
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[#425F54]">
                      {rule.triggeredBy.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                    <p className="mt-1.5 text-[11px] text-[#5B7A6F]">{rule.basisInEssay}</p>
                  </div>
                ))}
              </div>

              {/* Batas Kewenangan Petugas & Catatan Validasi */}
              <div className="space-y-2 rounded-2xl border border-[#DCEAE3] bg-white p-4 text-xs">
                <div className="flex items-start gap-2 font-semibold text-[#135D43]">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Batas Kewenangan Layanan:</span>
                </div>
                <p className="leading-relaxed text-[#425F54]">{decision.authorityNote}</p>
                <p className="rounded-lg bg-[#FFFDF4] p-2.5 text-[11px] text-[#6B5012]">
                  {decision.needsProfessionalValidationNote}
                </p>
                <p className="text-[11px] font-medium text-[#5E7C70]">{decision.disclaimer}</p>
              </div>
            </div>

            {/* Right Service Actions & Recalculate Column */}
            <div className="flex flex-col justify-between space-y-4 lg:col-span-5">
              <div className="space-y-4">
                <div className="space-y-2 rounded-2xl border border-[#DCEAE3] bg-[#F8FCFA] p-4">
                  <h2 className="text-sm font-bold text-[#0E2D24]">Langkah Selanjutnya:</h2>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-[#425F54]">
                    {decision.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B8A5A]" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-base font-extrabold text-[#0E2D24]">
                    Tentukan Tindak Lanjut Anda
                  </h2>
                  <p className="mt-0.5 text-xs text-[#47655B]">
                    Setelah membaca hasil dan alasan rekomendasi di samping, pilih langkah yang paling
                    sesuai dengan kesiapan Anda saat ini:
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#2A5E4A]">
                    Materi Edukasi yang Disarankan:
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {decision.recommendedCategories.map((cat) => (
                      <Link
                        key={cat}
                        to={`/informasi?category=${encodeURIComponent(cat)}`}
                        className="rounded-full border border-[#CBE5D7] bg-[#EFF8F3] px-3 py-1 text-xs font-semibold text-[#135D43] hover:bg-[#135D43] hover:text-white"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Link
                    to="/informasi"
                    className="cb-kiosk-target flex items-center justify-between rounded-2xl border border-[#DCEAE3] bg-white p-3.5 shadow-2xs hover:border-[#1B8A5A] hover:bg-[#F5FBF8]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF4FF] text-[#1D65C1]">
                        <BookOpen className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0E2D24]">
                          Informasi &amp; Edukasi Psikososial
                        </p>
                        <p className="text-xs text-[#557368]">Panduan perawatan diri &amp; keluarga</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#6A837B]" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickTrack('kader');
                      setQuickHelpOpen(true);
                    }}
                    className="cb-kiosk-target flex w-full items-center justify-between rounded-2xl border border-[#DCEAE3] bg-white p-3.5 text-left shadow-2xs hover:border-[#1B8A5A] hover:bg-[#F5FBF8]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F7EE] text-[#135D43]">
                        <Users className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0E2D24]">
                          {stored.createdRequest?.serviceTrack === 'kader'
                            ? 'Tambah Kontak / Minta Kader Lagi'
                            : 'Hubungi Kader Pendamping'}
                        </p>
                        <p className="text-xs text-[#557368]">
                          Dukungan psikososial awal komunitas
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#6A837B]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickTrack('konselor');
                      setQuickHelpOpen(true);
                    }}
                    className="cb-kiosk-target flex w-full items-center justify-between rounded-2xl border border-[#DCEAE3] bg-white p-3.5 text-left shadow-2xs hover:border-[#1B8A5A] hover:bg-[#F5FBF8]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E6F7F5] text-[#0F766E]">
                        <Headphones className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0E2D24]">
                          Dihubungkan dengan Konselor
                        </p>
                        <p className="text-xs text-[#557368]">
                          Peninjauan profesional &amp; rujukan
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#6A837B]" />
                  </button>

                  <Link
                    to="/bantuan"
                    className="cb-kiosk-target flex items-center justify-between rounded-2xl border border-[#F5B7B1] bg-[#FFF0F0] p-3.5 shadow-2xs hover:bg-[#FFE4E4]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D92D20] text-white">
                        <AlertCircle className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-[#B42318]">Bantuan Segera</p>
                        <p className="text-xs font-semibold text-[#8E2222]">
                          Kontak Darurat &amp; Eskalasi Langsung
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#B42318]" />
                  </Link>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-[#C5DDF8] bg-[#EEF6FD] p-3.5 text-xs font-medium text-[#184B8A]">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1D65C1]" />
                  <span>
                    Jika dalam keadaan darurat, segera hubungi petugas posko atau layanan darurat
                    119 / 112.
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EAF2EE] pt-4">
                <button
                  type="button"
                  onClick={handleEditAndRecalculate}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#CFE3D8] bg-white px-3.5 py-2.5 text-xs font-bold text-[#135D43] hover:bg-[#EFF8F3]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Ubah Jawaban &amp; Hitung Ulang
                </button>
                <Link
                  to="/assistant"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#135D43] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0E4834]"
                >
                  Tanya CARE Assistant
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <QuickHelpModal
        open={quickHelpOpen}
        onClose={() => setQuickHelpOpen(false)}
        defaultTrack={quickTrack}
        initialLocationPost={stored.inputSnapshot?.locationPost}
        initialPrimaryNeed={stored.inputSnapshot?.primaryNeed}
      />
    </div>
  );
}
