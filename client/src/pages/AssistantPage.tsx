import { AlertCircle, BookOpen, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AssistantPanel } from '@/components/AssistantPanel';
import { PrototypeBanner } from '@/components/PrototypeBanner';
import { PublicFooter } from '@/components/PublicFooter';
import { PublicHeader } from '@/components/PublicHeader';

export function AssistantPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5FBF8]">
      <PrototypeBanner />
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <div className="cb-card p-5">
              <span className="inline-block rounded-full bg-[#DCEBFB] px-3 py-1 text-xs font-bold text-[#1D65C1]">
                Demo — Basis Pengetahuan Lokal
              </span>
              <h1 className="mt-3 text-xl font-extrabold text-[#0E2D24]">CARE Assistant</h1>
              <p className="mt-2 text-sm leading-relaxed text-[#47655B]">
                Sesuai rancangan CARE BRIDGE, asisten ini terpisah dari pengarah layanan skrining dan
                hanya bertugas menjelaskan informasi umum dari materi tepercaya.
              </p>
              <div className="mt-4 space-y-2.5 text-xs text-[#2E5245]">
                <div className="flex items-start gap-2 rounded-xl bg-[#F4FAF6] p-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#135D43]" />
                  <span>
                    <strong>Status Fitur Demo:</strong> CARE Assistant mencari jawaban dari dokumen
                    pengetahuan lokal dan artikel terbit di CARE BRIDGE; pada prototipe ini belum
                    terhubung ke API LLM eksternal.
                  </span>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-[#FFF3F3] p-3 text-[#7A1818]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D92D20]" />
                  <span>
                    Untuk kondisi krisis akut atau bahaya langsung, segera akses{' '}
                    <Link to="/bantuan" className="font-bold underline">
                      Jalur Bantuan Segera
                    </Link>
                    .
                  </span>
                </div>
              </div>

              <Link
                to="/informasi"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#CFE3D8] bg-white px-4 py-2.5 text-xs font-bold text-[#135D43] hover:bg-[#EFF8F3]"
              >
                <BookOpen className="h-4 w-4" />
                Jelajahi Semua Materi Edukasi
              </Link>
            </div>
          </div>

          <div className="lg:col-span-8">
            <AssistantPanel />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
