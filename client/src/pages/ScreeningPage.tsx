import { useEffect, useMemo, useState } from 'react';
import { evaluateScreeningDecision } from '@shared/decisionEngine';
import { ACEH_POSKO_LOCATIONS } from '@shared/status';
import type {
  CompanionPreference,
  EmotionalState,
  SafetyStatus,
  ScreeningInput,
  SleepDifficulty,
} from '@shared/types';
import {
  screeningBasicInfoSchema,
  screeningConditionSchema,
  screeningConsentSchema,
  screeningPreferenceSchema,
  screeningSocialSupportSchema,
} from '@shared/validation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  GitBranch,
  Headphones,
  HeartHandshake,
  Loader2,
  Lock,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BotanicalCorners, BrandLogo } from '@/components/BrandLogo';
import { EscalationBanner } from '@/components/EscalationBanner';
import { PrototypeBanner } from '@/components/PrototypeBanner';
import { QuickHelpModal } from '@/components/QuickHelpModal';
import { SCREENING_DRAFT_KEY, SCREENING_RESULT_KEY } from '@/context/KioskContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';

const STEPS = [
  { num: 1, label: 'Persetujuan' },
  { num: 2, label: 'Data Diri' },
  { num: 3, label: 'Kondisi' },
  { num: 4, label: 'Dukungan' },
  { num: 5, label: 'Pendampingan' },
  { num: 6, label: 'Konfirmasi' },
] as const;

const NEED_OPTIONS = [
  'Ingin menenangkan diri & mengatasi rasa cemas',
  'Dukungan emosional setelah peristiwa bencana',
  'Kesulitan tidur atau beraktivitas sehari-hari',
  'Mendukung anak atau anggota keluarga lain',
  'Informasi layanan dan bantuan posko',
];

const PRACTICAL_NEED_OPTIONS = [
  'Tidak ada kebutuhan praktis mendesak',
  'Informasi layanan dan bantuan posko',
  'Koordinasi hunian sementara / kebutuhan dasar',
  'Pendampingan anak, lansia, atau kelompok rentan',
  'Akses layanan kesehatan fisik / perlindungan mendesak',
];

const SOCIAL_NEED_OPTIONS = [
  'Teman bicara yang mendengarkan tanpa menghakimi',
  'Informasi praktis cara menenangkan diri',
  'Kegiatan kebersamaan komunitas di posko',
  'Bantuan mendampingi keluarga / anak / lansia',
  'Arahan ke layanan konseling atau kesehatan',
];

const INITIAL_FORM: ScreeningInput = {
  understoodConfidentiality: false,
  agreedToProceed: false,
  isAnonymous: true,
  nickname: '',
  ageRange: '26-40 tahun',
  locationPost: ACEH_POSKO_LOCATIONS[0],
  agreedFollowUpContact: false,
  contactInfo: '',
  safetyStatus: 'aman',
  emotionalState: 'cemas_sedih_ringan',
  sleepDifficulty: 'kadang',
  activityDifficulty: 'sedikit',
  primaryNeed: '',
  additionalNotes: '',
  hasTrustedSupport: 'ya',
  practicalNeeds: ['Tidak ada kebutuhan praktis mendesak'],
  socialSupportNeeded: ['Teman bicara yang mendengarkan tanpa menghakimi'],
  companionPreference: 'cukup_informasi',
  sendRequestToQueue: undefined,
};

export function ScreeningPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<ScreeningInput>(() => {
    try {
      const saved = sessionStorage.getItem(SCREENING_DRAFT_KEY);
      if (saved) {
        return { ...INITIAL_FORM, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return INITIAL_FORM;
  });
  const [stepError, setStepError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [quickHelpOpen, setQuickHelpOpen] = useState(false);

  // Live computed rule-based preview directly from current answers
  const previewDecision = useMemo(() => evaluateScreeningDecision(form), [form]);

  // Persist active draft without deleting previous answers on Back
  useEffect(() => {
    try {
      sessionStorage.setItem(SCREENING_DRAFT_KEY, JSON.stringify(form));
    } catch {
      // ignore
    }
  }, [form]);

  useEffect(() => {
    const onCleared = () => {
      setForm(INITIAL_FORM);
      setStep(1);
      setStepError('');
    };
    window.addEventListener('cb:session-cleared', onCleared);
    return () => window.removeEventListener('cb:session-cleared', onCleared);
  }, []);

  const updateField = <K extends keyof ScreeningInput>(key: K, value: ScreeningInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (stepError) setStepError('');
  };

  const togglePracticalNeed = (option: string) => {
    setForm((prev) => {
      if (option === 'Tidak ada kebutuhan praktis mendesak') {
        return { ...prev, practicalNeeds: [option] };
      }
      const withoutNone = prev.practicalNeeds.filter(
        (o) => o !== 'Tidak ada kebutuhan praktis mendesak',
      );
      const exists = withoutNone.includes(option);
      const next = exists
        ? withoutNone.filter((o) => o !== option)
        : [...withoutNone, option];
      return {
        ...prev,
        practicalNeeds: next.length > 0 ? next : ['Tidak ada kebutuhan praktis mendesak'],
      };
    });
    if (stepError) setStepError('');
  };

  const toggleSocialNeed = (option: string) => {
    setForm((prev) => {
      const exists = prev.socialSupportNeeded.includes(option);
      const next = exists
        ? prev.socialSupportNeeded.filter((o) => o !== option)
        : [...prev.socialSupportNeeded, option];
      return { ...prev, socialSupportNeeded: next };
    });
    if (stepError) setStepError('');
  };

  const validateCurrentStep = (): boolean => {
    setStepError('');
    if (step === 1) {
      const res = screeningConsentSchema.safeParse({
        understoodConfidentiality: form.understoodConfidentiality,
        agreedToProceed: form.agreedToProceed,
      });
      if (!res.success) {
        setStepError(res.error.issues[0].message);
        return false;
      }
    } else if (step === 2) {
      const res = screeningBasicInfoSchema.safeParse({
        isAnonymous: form.isAnonymous,
        nickname: form.nickname,
        ageRange: form.ageRange,
        locationPost: form.locationPost,
        agreedFollowUpContact: form.agreedFollowUpContact,
        contactInfo: form.contactInfo,
      });
      if (!res.success) {
        setStepError(res.error.issues[0].message);
        return false;
      }
    } else if (step === 3) {
      const res = screeningConditionSchema.safeParse({
        safetyStatus: form.safetyStatus,
        emotionalState: form.emotionalState,
        sleepDifficulty: form.sleepDifficulty,
        activityDifficulty: form.activityDifficulty,
        primaryNeed: form.primaryNeed,
        additionalNotes: form.additionalNotes,
      });
      if (!res.success) {
        setStepError(res.error.issues[0].message);
        return false;
      }
    } else if (step === 4) {
      const res = screeningSocialSupportSchema.safeParse({
        hasTrustedSupport: form.hasTrustedSupport,
        practicalNeeds: form.practicalNeeds,
        socialSupportNeeded: form.socialSupportNeeded,
      });
      if (!res.success) {
        setStepError(res.error.issues[0].message);
        return false;
      }
    } else if (step === 5) {
      const res = screeningPreferenceSchema.safeParse({
        companionPreference: form.companionPreference,
      });
      if (!res.success) {
        setStepError(res.error.issues[0].message);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setStep((s) => Math.min(6, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStepError('');
    if (step === 1) {
      navigate('/');
      return;
    }
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    sessionStorage.removeItem(SCREENING_DRAFT_KEY);
    showToast('Skrining dibatalkan dan draf sementara dihapus', { variant: 'info' });
    navigate('/');
  };

  const handleSubmitScreening = async () => {
    setStepError('');
    setSubmitting(true);
    try {
      const payload: ScreeningInput = {
        ...form,
        sendRequestToQueue: previewDecision.shouldCreateRequest,
      };
      const res = await api.screening.submit(payload);
      sessionStorage.setItem(
        SCREENING_RESULT_KEY,
        JSON.stringify({
          ...res,
          inputSnapshot: payload,
        }),
      );
      showToast('Analisis skrining selesai disusun', {
        description: res.createdRequest
          ? `Permintaan tercatat dengan kode ${res.anonymousCode}.`
          : 'Rekomendasi informasi dan dukungan siap dilihat.',
      });
      navigate('/hasil');
    } catch (err) {
      setStepError(err instanceof Error ? err.message : 'Gagal mengirim skrining.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#F3FAF6]">
      <PrototypeBanner />
      <BotanicalCorners />

      {/* Top Header with Logo & Cancel */}
      <header className="relative z-10 border-b border-[#DCEAE3] bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/">
            <BrandLogo compact />
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuickHelpOpen(true)}
              className="hidden items-center gap-1.5 rounded-xl border border-[#CFE3D8] bg-[#EFF8F3] px-3 py-1.5 text-xs font-bold text-[#135D43] hover:bg-[#DCF0E4] sm:inline-flex"
            >
              <HeartHandshake className="h-4 w-4" />
              Minta Petugas Tanpa Skrining
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCEAE3] bg-white px-3 py-1.5 text-xs font-semibold text-[#47655B] hover:bg-[#FFF4F4] hover:text-[#B42318]"
            >
              <XCircle className="h-4 w-4" />
              Berhenti &amp; Batalkan
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Stepper Bar + Smooth Progress Indicator */}
        <nav aria-label="Tahapan skrining" className="mb-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#135D43]">
            <span>
              Langkah {step} dari {STEPS.length}: {STEPS[step - 1].label}
            </span>
            <span className="text-[#4F6E63]">{Math.round((step / STEPS.length) * 100)}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-[#DCEEE4]"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
          >
            <div
              className="h-full rounded-full bg-[#135D43] transition-[width] duration-300 ease-out"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>
          <ol className="grid grid-cols-3 gap-2 pt-1 sm:grid-cols-6 sm:gap-3">
            {STEPS.map((item) => {
              const isDone = step > item.num;
              const isActive = step === item.num;
              return (
                <li key={item.num} className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? 'scale-105 bg-[#135D43] text-white shadow-md'
                        : isDone
                          ? 'bg-[#269E69] text-white'
                          : 'border border-[#CFE3D8] bg-white text-[#6A837B]'
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : item.num}
                  </div>
                  <span
                    className={`mt-1.5 text-xs font-semibold ${
                      isActive
                        ? 'text-[#0E2D24]'
                        : isDone
                          ? 'text-[#135D43]'
                          : 'text-[#6A837B]'
                    }`}
                  >
                    {item.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        <div key={step} className="cb-step-enter">

        {/* STEP 1 — Persetujuan */}
        {step === 1 && (
          <div className="cb-card-elevated overflow-hidden p-5 sm:p-8">
            <div className="grid items-center gap-8 md:grid-cols-12">
              <div className="flex flex-col items-center rounded-2xl bg-[#F4FBF7] p-6 text-center md:col-span-5">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[#DCEFE4]">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#BCE3CD]">
                    <div className="relative flex h-16 w-14 items-center justify-center rounded-xl bg-[#135D43] text-white shadow-md">
                      <ShieldCheck className="h-10 w-10" />
                      <Lock className="absolute h-4 w-4 fill-white text-[#135D43]" />
                    </div>
                  </div>
                </div>
                <h2 className="mt-4 text-lg font-extrabold text-[#0E2D24]">
                  Minimalisasi Data &amp; Privasi
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-[#47655B]">
                  Kami hanya meminta informasi minimal (tanpa NIK atau alamat rumah lengkap). Data
                  digunakan untuk mengarahkan dukungan di prototipe ini; fitur enkripsi produksi
                  penuh belum diaktifkan pada server demo lokal.
                </p>
              </div>

              <div className="space-y-4 md:col-span-7">
                <div>
                  <h1 className="text-xl font-extrabold text-[#0E2D24] sm:text-2xl">
                    Persetujuan &amp; Penjelasan Layanan
                  </h1>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#47655B]">
                    Skrining awal ini bertujuan memetakan kebutuhan dukungan psikososial dan
                    kebutuhan praktis Anda melalui aturan konseptual —{' '}
                    <strong>bukan instrumen diagnosis medis atau skor klinis</strong>. Anda dapat
                    berhenti kapan saja atau meminta bantuan petugas tanpa mengisi skrining.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#CFE3D8] bg-[#F5FBF8] p-4 hover:bg-[#ECF8F1]">
                    <input
                      type="checkbox"
                      checked={form.understoodConfidentiality}
                      onChange={(e) => updateField('understoodConfidentiality', e.target.checked)}
                      className="h-5 w-5 shrink-0 accent-[#135D43]"
                    />
                    <span className="text-sm font-semibold text-[#113D2E]">
                      Saya memahami tujuan skrining ini, sifatnya yang sukarela, serta bukan alat
                      diagnosis profesional.
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#CFE3D8] bg-[#F5FBF8] p-4 hover:bg-[#ECF8F1]">
                    <input
                      type="checkbox"
                      checked={form.agreedToProceed}
                      onChange={(e) => updateField('agreedToProceed', e.target.checked)}
                      className="h-5 w-5 shrink-0 accent-[#135D43]"
                    />
                    <span className="text-sm font-semibold text-[#113D2E]">
                      Saya setuju untuk melanjutkan skrining secara sadar dan sukarela.
                    </span>
                  </label>
                </div>

                {stepError && (
                  <p role="alert" className="rounded-xl bg-[#FDECEC] px-4 py-2.5 text-xs font-semibold text-[#C93434]">
                    {stepError}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="cb-kiosk-target inline-flex items-center gap-2 rounded-xl border border-[#CFE3D8] bg-white px-5 py-3 text-sm font-bold text-[#2D4F43] hover:bg-[#F4FAF6]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="cb-kiosk-target inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#135D43] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0E4834] sm:flex-none sm:min-w-[200px]"
                  >
                    Lanjutkan
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Informasi Dasar Minimal */}
        {step === 2 && (
          <div className="cb-card-elevated mx-auto max-w-3xl space-y-5 p-6 sm:p-8">
            <div>
              <h1 className="text-xl font-extrabold text-[#0E2D24] sm:text-2xl">
                Informasi Dasar (Minimal &amp; Opsional Anonim)
              </h1>
              <p className="mt-1 text-sm text-[#47655B]">
                Kami tidak meminta NIK atau alamat rumah lengkap. Identitas Anda dapat tetap anonim.
              </p>
            </div>

            <div className="rounded-xl border border-[#DCEAE3] bg-[#F7FCF9] p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-[#0E2D24]">
                <input
                  type="checkbox"
                  checked={form.isAnonymous}
                  onChange={(e) => updateField('isAnonymous', e.target.checked)}
                  className="h-5 w-5 accent-[#135D43]"
                />
                Gunakan Identitas Anonim (sistem memberi kode Pengguna otomatis pada dashboard)
              </label>

              {!form.isAnonymous && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-[#47655B]">
                    Nama Panggilan Saja
                  </label>
                  <input
                    type="text"
                    value={form.nickname}
                    onChange={(e) => updateField('nickname', e.target.value)}
                    placeholder="Contoh: Kak Maya / Pak Hasan"
                    className="mt-1 w-full rounded-xl border border-[#CFE3D8] bg-white px-4 py-2.5 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#0E2D24]">Rentang Usia</label>
                <select
                  value={form.ageRange}
                  onChange={(e) => updateField('ageRange', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#CFE3D8] bg-white px-3.5 py-2.5 text-sm"
                >
                  <option value="Di bawah 18 tahun (didampingi wali)">
                    Di bawah 18 tahun (didampingi wali)
                  </option>
                  <option value="18-25 tahun">18–25 tahun</option>
                  <option value="26-40 tahun">26–40 tahun</option>
                  <option value="41-60 tahun">41–60 tahun</option>
                  <option value="Di atas 60 tahun">Di atas 60 tahun</option>
                  <option value="Tidak disebutkan">Lewati / Tidak disebutkan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0E2D24]">
                  Lokasi Posko atau Wilayah Layanan
                </label>
                <select
                  value={form.locationPost}
                  onChange={(e) => updateField('locationPost', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#CFE3D8] bg-white px-3.5 py-2.5 text-sm"
                >
                  {ACEH_POSKO_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-[#DCEAE3] bg-[#F7FCF9] p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-[#0E2D24]">
                <input
                  type="checkbox"
                  checked={form.agreedFollowUpContact}
                  onChange={(e) => updateField('agreedFollowUpContact', e.target.checked)}
                  className="h-5 w-5 accent-[#135D43]"
                />
                Saya menyetujui petugas menghubungi saya untuk tindak lanjut (opsional)
              </label>
              {form.agreedFollowUpContact && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-[#47655B]">
                    Cara Menghubungi (mis. lokasi tenda atau nomor pilihan Anda)
                  </label>
                  <input
                    type="text"
                    value={form.contactInfo}
                    onChange={(e) => updateField('contactInfo', e.target.value)}
                    placeholder="Contoh: Tenda Keluarga Blok B / WA 08xx-xxxx"
                    className="mt-1 w-full rounded-xl border border-[#CFE3D8] bg-white px-4 py-2.5 text-sm"
                  />
                </div>
              )}
            </div>

            {stepError && (
              <p role="alert" className="rounded-xl bg-[#FDECEC] px-4 py-2.5 text-xs font-semibold text-[#C93434]">
                {stepError}
              </p>
            )}

            <StepActions onBack={handleBack} onNext={handleNext} />
          </div>
        )}

        {/* STEP 3 — Rasa Aman, Perubahan Perasaan, Tidur & Aktivitas (ESAI Paragraf 21) */}
        {step === 3 && (
          <div className="cb-card-elevated mx-auto max-w-3xl space-y-5 p-6 sm:p-8">
            <div>
              <h1 className="text-xl font-extrabold text-[#0E2D24] sm:text-2xl">
                Kondisi Rasa Aman, Tidur &amp; Aktivitas Pascabencana
              </h1>
              <p className="mt-1 text-sm text-[#47655B]">
                Anda tidak perlu menceritakan kejadian traumatis secara rinci. Jawaban ini digunakan
                oleh sistem aturan untuk mengenali dukungan yang paling sesuai.
              </p>
            </div>

            {/* 1. Rasa Aman */}
            <div>
              <label className="block text-sm font-bold text-[#0E2D24]">
                1. Bagaimana rasa aman Anda di tempat tinggal / posko saat ini?
              </label>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                {(
                  [
                    { id: 'aman', label: 'Merasa cukup aman saat ini' },
                    { id: 'kurang_aman', label: 'Merasa kurang tenang / kurang aman' },
                    { id: 'bahaya_langsung', label: 'Sedang tidak aman / butuh bantuan segera' },
                  ] as Array<{ id: SafetyStatus; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateField('safetyStatus', opt.id)}
                    className={`rounded-xl border p-3.5 text-left text-sm ${
                      form.safetyStatus === opt.id
                        ? opt.id === 'bahaya_langsung'
                          ? 'border-2 border-[#D92D20] bg-[#FFF0F0] font-bold text-[#9E1F1F]'
                          : 'border-2 border-[#135D43] bg-[#E8F6EE] font-bold text-[#135D43]'
                        : 'border-[#DCEAE3] bg-white text-[#2E4D42] hover:bg-[#F5FBF8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Immediate Escalation directly inside Step 3 if user indicates danger */}
            {form.safetyStatus === 'bahaya_langsung' && <EscalationBanner />}

            {/* 2. Perubahan Perasaan */}
            <div>
              <label className="block text-sm font-bold text-[#0E2D24]">
                2. Bagaimana perubahan perasaan Anda setelah peristiwa bencana?
              </label>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                {(
                  [
                    { id: 'tenang_terkendali', label: 'Relatif tenang dan terkendali' },
                    { id: 'cemas_sedih_ringan', label: 'Sering cemas, khawatir, atau sedih' },
                    { id: 'tertekan_berat', label: 'Terasa sangat berat dan kewalahan' },
                  ] as Array<{ id: EmotionalState; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateField('emotionalState', opt.id)}
                    className={`rounded-xl border p-3.5 text-left text-sm ${
                      form.emotionalState === opt.id
                        ? 'border-2 border-[#135D43] bg-[#E8F6EE] font-bold text-[#135D43]'
                        : 'border-[#DCEAE3] bg-white text-[#2E4D42] hover:bg-[#F5FBF8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Kesulitan Tidur */}
            <div>
              <label className="block text-sm font-bold text-[#0E2D24]">
                3. Apakah Anda mengalami kesulitan tidur sejak kejadian?
              </label>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                {(
                  [
                    { id: 'tidak_ada', label: 'Tidur cukup baik' },
                    { id: 'kadang', label: 'Kadang sulit tidur / mudah terbangun' },
                    { id: 'sering_sulit_tidur', label: 'Sering sulit tidur hampir setiap malam' },
                  ] as Array<{ id: SleepDifficulty; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateField('sleepDifficulty', opt.id)}
                    className={`rounded-xl border p-3.5 text-left text-sm ${
                      form.sleepDifficulty === opt.id
                        ? 'border-2 border-[#135D43] bg-[#E8F6EE] font-bold text-[#135D43]'
                        : 'border-[#DCEAE3] bg-white text-[#2E4D42] hover:bg-[#F5FBF8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Kesulitan Aktivitas */}
            <div>
              <label className="block text-sm font-bold text-[#0E2D24]">
                4. Apakah Anda merasa kesulitan menjalankan aktivitas sehari-hari?
              </label>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                {(
                  [
                    { id: 'tidak', label: 'Tidak, masih bisa beraktivitas seperti biasa' },
                    { id: 'sedikit', label: 'Sedikit terganggu, namun masih dapat ditangani' },
                    { id: 'cukup_terganggu', label: 'Cukup terganggu, sering lelah atau sulit fokus' },
                    {
                      id: 'sangat_terganggu',
                      label: 'Sangat terganggu, kesulitan menjalani rutinitas harian',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateField('activityDifficulty', opt.id)}
                    className={`rounded-xl border p-3.5 text-left text-sm ${
                      form.activityDifficulty === opt.id
                        ? 'border-2 border-[#135D43] bg-[#E8F6EE] font-bold text-[#135D43]'
                        : 'border-[#DCEAE3] bg-white text-[#2E4D42] hover:bg-[#F5FBF8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Kebutuhan utama */}
            <div>
              <label className="block text-sm font-bold text-[#0E2D24]">
                5. Fokus kebutuhan utama yang ingin dibantu saat ini:
              </label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {NEED_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateField('primaryNeed', opt)}
                    className={`rounded-xl border p-3 text-left text-sm font-medium ${
                      form.primaryNeed === opt
                        ? 'border-2 border-[#135D43] bg-[#E8F6EE] font-bold text-[#135D43]'
                        : 'border-[#DCEAE3] bg-white text-[#2E4D42] hover:bg-[#F5FBF8]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={form.primaryNeed}
                onChange={(e) => updateField('primaryNeed', e.target.value)}
                placeholder="Atau tuliskan singkat kebutuhan utama Anda..."
                className="mt-2.5 w-full rounded-xl border border-[#CFE3D8] bg-white px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0E2D24]">
                Catatan Tambahan (Opsional — tidak perlu menceritakan peristiwa secara rinci)
              </label>
              <textarea
                rows={2}
                value={form.additionalNotes}
                onChange={(e) => updateField('additionalNotes', e.target.value)}
                placeholder="Catatan singkat bila ada hal yang ingin diketahui pendamping..."
                className="mt-1.5 w-full rounded-xl border border-[#CFE3D8] bg-white px-4 py-2 text-sm"
              />
            </div>

            {stepError && (
              <p role="alert" className="rounded-xl bg-[#FDECEC] px-4 py-2.5 text-xs font-semibold text-[#C93434]">
                {stepError}
              </p>
            )}

            <StepActions onBack={handleBack} onNext={handleNext} />
          </div>
        )}

        {/* STEP 4 — Dukungan Sosial & Kebutuhan Praktis (ESAI Paragraf 21) */}
        {step === 4 && (
          <div className="cb-card-elevated mx-auto max-w-3xl space-y-5 p-6 sm:p-8">
            <div>
              <h1 className="text-xl font-extrabold text-[#0E2D24] sm:text-2xl">
                Dukungan Sosial &amp; Kebutuhan Praktis
              </h1>
              <p className="mt-1 text-sm text-[#47655B]">
                Ketersediaan orang terdekat dan kebutuhan praktis yang belum terpenuhi membantu
                sistem menentukan apakah Anda membutuhkan pendampingan atau penghubung layanan.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0E2D24]">
                1. Apakah saat ini ada keluarga, teman, atau orang tepercaya yang mendampingi?
              </label>
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
                {(
                  [
                    { id: 'ya', label: 'Ya, ada orang terdekat bersama saya' },
                    { id: 'terbatas', label: 'Ada, namun terbatas / berjauhan' },
                    { id: 'tidak_ada', label: 'Belum ada pendamping terdekat saat ini' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateField('hasTrustedSupport', opt.id)}
                    className={`rounded-xl border p-3.5 text-left text-sm ${
                      form.hasTrustedSupport === opt.id
                        ? 'border-2 border-[#135D43] bg-[#E8F6EE] font-bold text-[#135D43]'
                        : 'border-[#DCEAE3] bg-white text-[#2E4D42] hover:bg-[#F5FBF8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0E2D24]">
                2. Apakah ada kebutuhan praktis yang belum terpenuhi saat ini?
              </label>
              <div className="mt-2 space-y-2">
                {PRACTICAL_NEED_OPTIONS.map((opt) => {
                  const selected = form.practicalNeeds.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${
                        selected
                          ? 'border-[#135D43] bg-[#E8F6EE] font-semibold text-[#135D43]'
                          : 'border-[#DCEAE3] bg-white text-[#2E4D42] hover:bg-[#F5FBF8]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => togglePracticalNeed(opt)}
                        className="h-4.5 w-4.5 accent-[#135D43]"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0E2D24]">
                3. Bentuk dukungan sosial apa yang dirasa paling membantu?
              </label>
              <div className="mt-2 space-y-2">
                {SOCIAL_NEED_OPTIONS.map((opt) => {
                  const selected = form.socialSupportNeeded.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${
                        selected
                          ? 'border-[#135D43] bg-[#E8F6EE] font-semibold text-[#135D43]'
                          : 'border-[#DCEAE3] bg-white text-[#2E4D42] hover:bg-[#F5FBF8]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSocialNeed(opt)}
                        className="h-4.5 w-4.5 accent-[#135D43]"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {stepError && (
              <p role="alert" className="rounded-xl bg-[#FDECEC] px-4 py-2.5 text-xs font-semibold text-[#C93434]">
                {stepError}
              </p>
            )}

            <StepActions onBack={handleBack} onNext={handleNext} />
          </div>
        )}

        {/* STEP 5 — Keinginan Berbicara dengan Pendamping & Analisis Rule-Based Live */}
        {step === 5 && (
          <div className="cb-card-elevated mx-auto max-w-3xl space-y-5 p-6 sm:p-8">
            <div>
              <h1 className="text-xl font-extrabold text-[#0E2D24] sm:text-2xl">
                Keinginan Berbicara dengan Pendamping
              </h1>
              <p className="mt-1 text-sm text-[#47655B]">
                Sampaikan kesiapan Anda untuk berbicara dengan pendamping. Sistem akan menggabungkan
                preferensi ini bersama jawaban kondisi Anda pada tahap sebelumnya.
              </p>
            </div>

            <div className="grid gap-3">
              {(
                [
                  {
                    id: 'cukup_informasi',
                    title: 'Untuk saat ini saya cukup membaca informasi & panduan mandiri dahulu',
                    desc: 'Catatan: bila jawaban kondisi sebelumnya memerlukan perhatian tambahan, sistem tetap memberi rekomendasi pendampingan.',
                    icon: BookOpen,
                    accent: 'text-[#1D65C1] bg-[#EBF4FF]',
                  },
                  {
                    id: 'ingin_berbicara_kader',
                    title: 'Saya ingin berbicara dengan kader pendamping komunitas',
                    desc: 'Didampingi relawan terlatih setempat untuk mendengarkan dan membantu akses posko.',
                    icon: Users,
                    accent: 'text-[#135D43] bg-[#E7F7EE]',
                  },
                  {
                    id: 'ingin_konselor',
                    title: 'Saya merasa perlu dihubungkan dengan konselor profesional',
                    desc: 'Permintaan ditinjau langsung oleh konselor profesional sesuai kompetensi.',
                    icon: Headphones,
                    accent: 'text-[#0F766E] bg-[#E6F7F5]',
                  },
                  {
                    id: 'butuh_bantuan_segera',
                    title: 'Saya membutuhkan bantuan segera atau merasa dalam keadaan mendesak',
                    desc: 'Menampilkan instruksi eskalasi manusia dan layanan darurat secara langsung.',
                    icon: AlertCircle,
                    accent: 'text-[#D92D20] bg-[#FDECEC]',
                  },
                ] as Array<{
                  id: CompanionPreference;
                  title: string;
                  desc: string;
                  icon: React.ComponentType<{ className?: string }>;
                  accent: string;
                }>
              ).map((option) => {
                const Icon = option.icon;
                const selected = form.companionPreference === option.id;
                const isUrgent = option.id === 'butuh_bantuan_segera';

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateField('companionPreference', option.id)}
                    className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? isUrgent
                          ? 'border-2 border-[#D92D20] bg-[#FFF2F2] shadow-sm'
                          : 'border-2 border-[#135D43] bg-[#ECF8F1] shadow-sm'
                        : isUrgent
                          ? 'border-[#F5C2C2] bg-[#FFF8F8] hover:bg-[#FFF0F0]'
                          : 'border-[#DCEAE3] bg-white hover:bg-[#F5FBF8]'
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${option.accent}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-sm font-bold sm:text-base ${
                          isUrgent ? 'text-[#9E1F1F]' : 'text-[#0E2D24]'
                        }`}
                      >
                        {option.title}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#47655B]">{option.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {previewDecision.isImmediateHelp && <EscalationBanner />}

            {/* Live Rule-Based Preview */}
            <div className="rounded-2xl border border-[#C7E4D3] bg-[#F4FBF7] p-4">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#135D43]">
                <GitBranch className="h-4 w-4" />
                Pratinjau Hasil Pengarah Layanan (Otomatis dari Jawaban Anda)
              </div>
              <p className="mt-1.5 text-sm font-bold text-[#0E2D24]">
                {previewDecision.summaryTitle}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#425F54]">
                {previewDecision.reasoningSummary}
              </p>
            </div>

            {stepError && (
              <p role="alert" className="rounded-xl bg-[#FDECEC] px-4 py-2.5 text-xs font-semibold text-[#C93434]">
                {stepError}
              </p>
            )}

            <StepActions onBack={handleBack} onNext={handleNext} />
          </div>
        )}

        {/* STEP 6 — Konfirmasi & Penelusuran Rekomendasi */}
        {step === 6 && (
          <div className="cb-card-elevated mx-auto max-w-3xl space-y-5 p-6 sm:p-8">
            <div>
              <h1 className="text-xl font-extrabold text-[#0E2D24] sm:text-2xl">
                Konfirmasi Jawaban &amp; Pratinjau Rekomendasi
              </h1>
              <p className="mt-1 text-sm text-[#47655B]">
                Periksa ringkasan jawaban serta analisis aturan sistem. Jika Anda kembali dan
                mengubah jawaban, sistem akan menghitung ulang rekomendasi secara otomatis.
              </p>
            </div>

            {previewDecision.isImmediateHelp && <EscalationBanner compact />}

            {/* Summary of Answers */}
            <dl className="divide-y divide-[#EAF2EE] rounded-2xl border border-[#DCEAE3] bg-[#F8FCFA] px-5 py-2 text-sm">
              <div className="grid gap-1 py-3 sm:grid-cols-3">
                <dt className="font-semibold text-[#47655B]">Identitas &amp; Posko</dt>
                <dd className="font-bold text-[#0E2D24] sm:col-span-2">
                  {form.isAnonymous ? 'Anonim' : form.nickname} • {form.ageRange} —{' '}
                  {form.locationPost}
                </dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-3">
                <dt className="font-semibold text-[#47655B]">Kondisi &amp; Rasa Aman</dt>
                <dd className="font-medium text-[#0E2D24] sm:col-span-2">
                  Keamanan: <strong>{form.safetyStatus.replace('_', ' ')}</strong> • Tidur:{' '}
                  <strong>{form.sleepDifficulty.replace(/_/g, ' ')}</strong> • Aktivitas:{' '}
                  <strong>{form.activityDifficulty.replace(/_/g, ' ')}</strong>
                </dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-3">
                <dt className="font-semibold text-[#47655B]">Kebutuhan Utama</dt>
                <dd className="font-medium text-[#0E2D24] sm:col-span-2">{form.primaryNeed}</dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-3">
                <dt className="font-semibold text-[#47655B]">Dukungan &amp; Praktis</dt>
                <dd className="font-medium text-[#0E2D24] sm:col-span-2">
                  Pendamping sekitar: <strong>{form.hasTrustedSupport.replace('_', ' ')}</strong> •{' '}
                  {form.practicalNeeds.join(', ')}
                </dd>
              </div>
            </dl>

            {/* Rule-Based Recommendation Trace */}
            <div className="rounded-2xl border border-[#BFE2CE] bg-[#ECF8F1] p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#135D43]">
                <GitBranch className="h-4 w-4" />
                Hasil Analisis Rule-Based System
              </div>
              <h2 className="mt-1.5 text-lg font-extrabold text-[#0E2D24]">
                {previewDecision.summaryTitle}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#28473D]">
                {previewDecision.reasoningSummary}
              </p>

              {previewDecision.matchedRules.map((rule) => (
                <div key={rule.code} className="mt-3 rounded-xl bg-white/90 p-3 text-xs">
                  <p className="font-bold text-[#135D43]">
                    Aturan: {rule.label} ({rule.code})
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[#38594D]">
                    {rule.triggeredBy.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-[11px] text-[#5B7A6F]">{rule.basisInEssay}</p>
                </div>
              ))}
            </div>

            {/* Voluntary consent toggle if system suggests kader/konselor */}
            {previewDecision.track !== 'edukasi' && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#CFE3D8] bg-[#F7FCF9] p-4 text-xs font-semibold text-[#114432]">
                <input
                  type="checkbox"
                  checked={previewDecision.shouldCreateRequest}
                  onChange={(e) => updateField('sendRequestToQueue', e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-[#135D43]"
                />
                <span>
                  Teruskan permintaan pendampingan anonim saya ke antrean{' '}
                  {previewDecision.track === 'kader'
                    ? 'Kader Pendamping'
                    : 'Konselor Profesional'}{' '}
                  sesuai rekomendasi di atas (Anda boleh melepas centang jika hanya ingin melihat
                  hasil &amp; materi tanpa mengirim permintaan).
                </span>
              </label>
            )}

            <div className="flex items-start gap-2.5 rounded-xl bg-[#FFFDF4] border border-[#F2E0AF] p-3.5 text-xs text-[#6B5012]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{previewDecision.needsProfessionalValidationNote}</span>
            </div>

            {stepError && (
              <p role="alert" className="rounded-xl bg-[#FDECEC] px-4 py-2.5 text-xs font-semibold text-[#C93434]">
                {stepError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="cb-kiosk-target inline-flex items-center gap-2 rounded-xl border border-[#CFE3D8] bg-white px-5 py-3 text-sm font-bold text-[#2D4F43] hover:bg-[#F4FAF6]"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali &amp; Ubah Jawaban
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitScreening}
                className="cb-kiosk-target inline-flex items-center justify-center gap-2 rounded-xl bg-[#135D43] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0E4834] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses Analisis...
                  </>
                ) : (
                  <>
                    Selesai &amp; Lihat Rekomendasi Lengkap
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        </div>
      </main>

      <QuickHelpModal open={quickHelpOpen} onClose={() => setQuickHelpOpen(false)} />
    </div>
  );
}

function StepActions({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAF2EE] pt-4">
      <button
        type="button"
        onClick={onBack}
        className="cb-kiosk-target inline-flex items-center gap-2 rounded-xl border border-[#CFE3D8] bg-white px-5 py-3 text-sm font-bold text-[#2D4F43] hover:bg-[#F4FAF6]"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>
      <button
        type="button"
        onClick={onNext}
        className="cb-kiosk-target inline-flex items-center justify-center gap-2 rounded-xl bg-[#135D43] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0E4834]"
      >
        Lanjutkan
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
