import { useState } from 'react';
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Headphones,
  HeartHandshake,
  MapPin,
  PhoneCall,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EscalationBanner } from '@/components/EscalationBanner';
import { PrototypeBanner } from '@/components/PrototypeBanner';
import { PublicFooter } from '@/components/PublicFooter';
import { PublicHeader } from '@/components/PublicHeader';
import { QuickHelpModal } from '@/components/QuickHelpModal';
import { RevealOnScroll } from '@/components/RevealOnScroll';

const EMERGENCY_CHANNELS = [
  {
    name: 'Layanan Gawat Darurat Nasional (Medis / Krisis)',
    number: '119 / 112',
    note: 'Tersedia 24 jam untuk keadaan darurat medis dan keselamatan jiwa.',
    icon: PhoneCall,
  },
  {
    name: 'Posko Tanggap Darurat BPBA & Dinsos Aceh',
    number: 'Meja Siaga Posko Utama',
    note: 'Temui petugas berseragam di posko pengungsian atau kantor camat/gampong terdekat.',
    icon: MapPin,
  },
  {
    name: 'Rumah Sakit Umum Daerah dr. Zainoel Abidin (RSUDZA)',
    number: 'IGD / Layanan Kesehatan Jiwa Banda Aceh',
    note: 'Rujukan fasilitas tingkat lanjut jika terjadi krisis psikologis atau medis akut.',
    icon: Building2,
  },
];

export function HelpEscalationPage() {
  const [quickHelpOpen, setQuickHelpOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#F5FBF8]">
      <PrototypeBanner />
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#0E2D24] sm:text-3xl">
            Informasi Bantuan &amp; Jalur Eskalasi
          </h1>
          <p className="max-w-2xl text-sm text-[#47655B]">
            Anda dapat meminta pertolongan segera atau pendampingan tanpa harus mengisi skrining
            terlebih dahulu.
          </p>
        </div>

        <EscalationBanner hideBantuanLink />

        <section className="grid gap-4 md:grid-cols-3">
          {EMERGENCY_CHANNELS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <RevealOnScroll key={item.name} delayMs={idx * 70}>
                <div className="cb-card cb-card-interactive h-full p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDECEC] text-[#C93434]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-3 text-base font-bold text-[#0E2D24]">{item.name}</h2>
                  <p className="mt-1 text-lg font-extrabold text-[#B42318]">{item.number}</p>
                  <p className="mt-2 text-xs leading-relaxed text-[#47655B]">{item.note}</p>
                </div>
              </RevealOnScroll>
            );
          })}
        </section>

        <RevealOnScroll>
          <section className="cb-card p-6 sm:p-8">
          <h2 className="text-lg font-extrabold text-[#0E2D24]">
            Pilihan Jalur Pendampingan di CARE BRIDGE
          </h2>
          <p className="mt-1 text-sm text-[#47655B]">
            Jika kondisi tidak mengancam nyawa namun Anda ingin didampingi:
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#DCEAE3] bg-[#F8FCFA] p-5">
              <Users className="h-6 w-6 text-[#135D43]" />
              <h3 className="mt-3 text-base font-bold text-[#0E2D24]">
                Minta Pendamping Langsung
              </h3>
              <p className="mt-1 text-xs text-[#47655B]">
                Kirim permintaan singkat ke Kader Pendamping tanpa perlu mengisi skrining 6 tahap.
              </p>
              <button
                type="button"
                onClick={() => setQuickHelpOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#135D43] px-4 py-2 text-xs font-bold text-white hover:bg-[#0E4834]"
              >
                <HeartHandshake className="h-4 w-4" />
                Minta Pendamping Sekarang
              </button>
            </div>

            <div className="rounded-2xl border border-[#DCEAE3] bg-[#F8FCFA] p-5">
              <ClipboardCheck className="h-6 w-6 text-[#1B8A5A]" />
              <h3 className="mt-3 text-base font-bold text-[#0E2D24]">Skrining Kebutuhan</h3>
              <p className="mt-1 text-xs text-[#47655B]">
                Isi skrining singkat 6 langkah agar diarahkan ke edukasi, kader, atau konselor.
              </p>
              <Link
                to="/skrining"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#135D43] bg-white px-4 py-2 text-xs font-bold text-[#135D43] hover:bg-[#EFF8F3]"
              >
                Mulai Skrining
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-[#DCEAE3] bg-[#F8FCFA] p-5">
              <Headphones className="h-6 w-6 text-[#0F766E]" />
              <h3 className="mt-3 text-base font-bold text-[#0E2D24]">
                Portal Kader &amp; Konselor
              </h3>
              <p className="mt-1 text-xs text-[#47655B]">
                Petugas pendamping dan konselor profesional dapat masuk untuk memproses antrean.
              </p>
              <Link
                to="/masuk"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#DCEAE3] bg-white px-4 py-2 text-xs font-bold text-[#2E5245] hover:bg-[#EFF8F3]"
              >
                Masuk Dashboard Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          </section>
        </RevealOnScroll>
      </main>

      <PublicFooter />
      <QuickHelpModal open={quickHelpOpen} onClose={() => setQuickHelpOpen(false)} />
    </div>
  );
}
