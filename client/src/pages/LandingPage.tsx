import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Headphones,
  Info,
  MessageCircleHeart,
  Monitor,
  Play,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BotanicalCorners } from '@/components/BrandLogo';
import { PrototypeBanner } from '@/components/PrototypeBanner';
import { PublicFooter } from '@/components/PublicFooter';
import { PublicHeader } from '@/components/PublicHeader';
import { QuickHelpModal } from '@/components/QuickHelpModal';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import { useLightParallax } from '@/hooks/useMotion';

const THREE_COMPONENTS = [
  {
    badge: 'Komponen 1',
    title: 'Digital Psychosocial Screening Kiosk',
    desc: 'Pintu masuk sukarela di posko atau web. Memetakan kebutuhan dasar penyintas secara anonim tanpa diagnosis klinis dan menyediakan opsi bantuan langsung tanpa skrining.',
    icon: Monitor,
    accent: 'bg-[#EBF4FF] text-[#1D65C1]',
  },
  {
    badge: 'Komponen 2',
    title: 'Community Psychosocial Cadre',
    desc: 'Kader terlatih dari masyarakat setempat yang mendengarkan secara empatik (PFA), membantu kebutuhan praktis awal, dan mengoordinasikan dukungan sosial komunitas.',
    icon: Users,
    accent: 'bg-[#E7F7EE] text-[#135D43]',
  },
  {
    badge: 'Komponen 3',
    title: 'Counselor Supervision & Referral',
    desc: 'Konselor profesional membina dan menyupervisi kader secara terjadwal maupun segera, menangani kasus lanjutan, serta menghubungkan rujukan ke fasilitas kesehatan.',
    icon: Headphones,
    accent: 'bg-[#E6F7F5] text-[#0F766E]',
  },
];

const FLOW_STEPS = [
  { label: 'Penyintas', icon: UserRound, desc: 'Masuk lewat web atau kiosk posko' },
  { label: 'Persetujuan & Skrining', icon: ClipboardCheck, desc: '6 tahap sukarela & minimal data' },
  { label: 'Kader Pendamping', icon: Users, desc: 'Dukungan awal & tindak lanjut' },
  { label: 'Konselor Profesional', icon: Headphones, desc: 'Supervisi, konseling & rujukan' },
  { label: 'Tindak Lanjut', icon: CheckCircle2, desc: 'Langkah selanjutnya tercatat jelas' },
];

export function LandingPage() {
  const [quickHelpOpen, setQuickHelpOpen] = useState(false);
  const heroParallaxY = useLightParallax(12);

  return (
    <div className="flex min-h-screen flex-col bg-[#F5FBF8]">
      <PrototypeBanner />
      <PublicHeader />

      <main className="flex-1">
        {/* HERO SECTION — Staggered calm entrance + light illustration depth */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#F4FBF7] via-[#FAFDFB] to-[#E6F5EC]">
          <BotanicalCorners />

          <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:pb-12 lg:pt-12">
            <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
              {/* Left Hero Content */}
              <div className="space-y-5 lg:col-span-5">
                <div className="space-y-2.5">
                  <div className="cb-hero-enter inline-flex items-center gap-2 rounded-full border border-[#CBE5D7] bg-white/90 px-3 py-1 text-[11px] font-bold text-[#135D43] shadow-2xs">
                    <span>Skrining Digital</span>
                    <span aria-hidden="true">→</span>
                    <span>Kader Komunitas</span>
                    <span aria-hidden="true">→</span>
                    <span>Konselor</span>
                  </div>

                  <h1 className="cb-hero-enter text-4xl font-extrabold tracking-tight text-[#0E2D24] sm:text-5xl">
                    CARE BRIDGE
                  </h1>
                  <p className="cb-hero-enter cb-hero-delay-1 text-xl font-bold leading-snug text-[#135D43] sm:text-2xl">
                    Menghubungkan Kepedulian,
                    <br />
                    Menguatkan Pemulihan.
                  </p>
                  <p className="cb-hero-enter cb-hero-delay-2 max-w-md text-sm leading-relaxed text-[#425F54] sm:text-base">
                    Platform layanan konseling krisis berbasis komunitas untuk mendukung pemulihan
                    psikososial masyarakat pascabencana di Aceh.
                  </p>
                </div>

                {/* Stacked 3 CTA buttons */}
                <div className="cb-hero-enter cb-hero-delay-3 flex max-w-sm flex-col gap-3 pt-1">
                  <Link
                    to="/skrining"
                    className="cb-kiosk-target cb-btn-lift group inline-flex items-center justify-between rounded-xl bg-[#135D43] px-5 py-3.5 text-base font-bold text-white shadow-md hover:bg-[#0E4834]"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </span>
                      Mulai Skrining
                    </span>
                    <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setQuickHelpOpen(true)}
                    className="cb-kiosk-target cb-btn-lift inline-flex items-center justify-center gap-2.5 rounded-xl border border-[#CFE3D8] bg-white px-5 py-3.5 text-sm font-bold text-[#135D43] shadow-xs hover:bg-[#EFF8F3]"
                  >
                    <Users className="h-4.5 w-4.5 text-[#1B8A5A]" />
                    Saya Membutuhkan Pendamping
                  </button>

                  <Link
                    to="/informasi"
                    className="cb-kiosk-target cb-btn-lift inline-flex items-center justify-center gap-2.5 rounded-xl border border-[#CFE3D8] bg-white px-5 py-3.5 text-sm font-bold text-[#135D43] shadow-xs hover:bg-[#EFF8F3]"
                  >
                    <Info className="h-4.5 w-4.5 text-[#1B8A5A]" />
                    Informasi Dukungan Psikososial
                  </Link>
                </div>
              </div>

              {/* Right Hero Illustration with light scroll parallax */}
              <div className="cb-hero-enter cb-hero-delay-2 relative lg:col-span-7">
                <div
                  style={{ transform: `translate3d(0, ${heroParallaxY}px, 0)` }}
                  className="relative overflow-hidden rounded-3xl border border-[#D4E8DC] bg-[#EAF6F0] shadow-lg transition-transform duration-75"
                >
                  <img
                    src="/images/hero-aceh-community.jpg"
                    alt="Ilustrasi kader pendamping CARE BRIDGE menemani penyintas pascabencana dengan latar Masjid Raya Baiturrahman Aceh"
                    className="h-auto w-full object-cover"
                  />
                  <div className="cb-soft-float pointer-events-none absolute right-5 top-4 rounded-2xl bg-white/80 px-3.5 py-1.5 backdrop-blur-xs sm:right-7 sm:top-6">
                    <span className="font-script-aceh text-2xl font-bold leading-none text-[#135D43] sm:text-3xl">
                      Bersama, Kita Pulih
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Privacy & Inclusive Non-Digital Access Bar — Always immediately visible */}
            <div className="mt-8 grid gap-3 rounded-2xl border border-[#CFE3D8] bg-white/90 px-5 py-3.5 shadow-xs backdrop-blur-xs md:grid-cols-3 md:divide-x md:divide-[#DCEAE3]">
              <div className="flex items-center justify-center gap-2.5 text-xs font-semibold text-[#184838] sm:text-sm">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#1B8A5A]" />
                <span>Minimalisasi data: tanpa NIK atau alamat lengkap.</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 text-xs font-semibold text-[#184838] sm:text-sm md:pl-4">
                <Users className="h-5 w-5 shrink-0 text-[#1B8A5A]" />
                <span>Dapat meminta bantuan petugas tanpa mengisi skrining.</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 text-xs font-semibold text-[#184838] sm:text-sm md:pl-4">
                <AlertCircle className="h-5 w-5 shrink-0 text-[#D92D20]" />
                <span>Tersedia jalur tatap muka &amp; bantuan segera tanpa menunggu layar.</span>
              </div>
            </div>
          </div>
        </section>

        {/* THREE CORE COMPONENTS SECTION (ESAI.docx Pembahasan & Lampiran 1-6) */}
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:pt-14">
          <RevealOnScroll>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-[#0E2D24] sm:text-2xl">
                  Tiga Komponen Utama CARE BRIDGE
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-[#47655B]">
                  Menjembatani pengenalan kebutuhan awal, pendampingan di lingkungan masyarakat, dan
                  penjaminan mutu oleh konselor profesional (rancangan konseptual).
                </p>
              </div>
            </div>
          </RevealOnScroll>

          <div className="grid gap-5 md:grid-cols-3">
            {THREE_COMPONENTS.map((comp, idx) => {
              const Icon = comp.icon;
              return (
                <RevealOnScroll key={comp.title} delayMs={idx * 90}>
                  <div className="cb-card cb-card-interactive flex h-full flex-col justify-between p-5 sm:p-6">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-[#EFF8F3] px-3 py-1 text-[11px] font-bold text-[#135D43]">
                          {comp.badge}
                        </span>
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${comp.accent}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="mt-4 text-base font-extrabold text-[#0E2D24]">
                        {comp.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-[#47655B] sm:text-sm">
                        {comp.desc}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </section>

        {/* INTEGRATED SERVICE FLOW SECTION — Matches Lampiran 3 & 4 */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <RevealOnScroll>
            <div className="cb-card overflow-hidden p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAF2EE] pb-5">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0E2D24] sm:text-2xl">
                    Alur Layanan Terintegrasi CARE BRIDGE
                  </h2>
                  <p className="mt-1 text-sm text-[#47655B]">
                    Aturan keputusan memetakan jalur dukungan berdasarkan jawaban penyintas,
                    sedangkan CARE Assistant ditempatkan terpisah hanya untuk informasi umum.
                  </p>
                </div>
                <span className="rounded-full bg-[#135D43] px-4 py-1.5 text-xs font-bold text-white">
                  Prototipe Demo
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {FLOW_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <RevealOnScroll key={step.label} delayMs={idx * 70}>
                      <div className="cb-card-interactive relative flex h-full flex-col items-center rounded-2xl border border-[#E2EFE8] bg-[#F8FCFA] p-4 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E3F4EA] text-[#135D43]">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="mt-3 text-sm font-bold text-[#0E2D24]">{step.label}</h3>
                        <p className="mt-1 text-xs text-[#4F6E63]">{step.desc}</p>
                        {idx < FLOW_STEPS.length - 1 && (
                          <ArrowRight
                            className="mt-2 hidden h-4 w-4 text-[#1B8A5A] lg:absolute lg:-right-3 lg:top-1/2 lg:mt-0 lg:block lg:-translate-y-1/2"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </RevealOnScroll>
                  );
                })}
              </div>

              {/* Quick pathway cards: CARE Assistant (separate path) & Urgent Help (always prominent) */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="cb-card-interactive flex flex-col justify-between gap-4 rounded-2xl border border-[#CFE3D8] bg-[#EFF8F3] p-5 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#135D43] text-white">
                      <MessageCircleHeart className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0E2D24]">
                        CARE Assistant (Jalur Informasi Terpisah — Demo Lokal)
                      </h3>
                      <p className="mt-0.5 text-xs text-[#47655B]">
                        Pencarian informasi umum dari materi lokal; tidak menentukan keputusan klinis
                        atau hasil skrining.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/assistant"
                    className="cb-btn-lift shrink-0 rounded-xl bg-[#135D43] px-4 py-2 text-center text-xs font-bold text-white hover:bg-[#0E4834]"
                  >
                    Buka Assistant
                  </Link>
                </div>

                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#F5C2C2] bg-[#FFF4F4] p-5 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D92D20] text-white">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#7A1818]">
                        Butuh Bantuan Segera atau Keadaan Darurat?
                      </h3>
                      <p className="mt-0.5 text-xs text-[#6E1717]">
                        Bantuan segera tidak menunggu skrining atau respons AI. Akses kontak dan
                        eskalasi langsung.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/bantuan"
                    className="cb-btn-lift shrink-0 rounded-xl bg-[#D92D20] px-4 py-2 text-center text-xs font-bold text-white hover:bg-[#B42318]"
                  >
                    Jalur Bantuan
                  </Link>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </section>
      </main>

      <PublicFooter />

      <QuickHelpModal open={quickHelpOpen} onClose={() => setQuickHelpOpen(false)} />
    </div>
  );
}
