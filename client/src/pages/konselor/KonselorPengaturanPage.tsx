import { useEffect, useState } from 'react';
import type { KnowledgeDocument } from '@shared/types';
import { Database, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';

export function KonselorPengaturanPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadKnowledge = async () => {
    try {
      const res = await api.education.listKnowledge();
      setDocs(res.documents);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadKnowledge();
  }, []);

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.demo.reset();
      setResetOpen(false);
      showToast('Seluruh data demonstrasi berhasil dikembalikan ke kondisi awal');
      window.dispatchEvent(new CustomEvent('cb:demo-reset'));
    } catch (err) {
      showToast('Gagal mereset data demo', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <DashboardLayout
      title="Pengaturan & Keterbatasan Prototipe"
      subtitle="Konfigurasi demonstrasi, reset data simulasi, dan transparansi arsitektur"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-6">
          <div className="cb-card p-6">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-[#0E2D24]">
              <Database className="h-5 w-5 text-[#135D43]" />
              Reset Data Demonstrasi
            </h2>
            <p className="mt-2 text-sm text-[#47655B]">
              Gunakan fitur ini sebelum atau sesudah presentasi untuk mengembalikan seluruh antrean
              permintaan, supervisi, rujukan, dan artikel edukasi ke data awal simulasi tanpa
              menghapus konfigurasi aplikasi.
            </p>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#135D43] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0E4834]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Data Demonstrasi Sekarang
            </button>
          </div>

          <div className="cb-card border-[#F5DDA9] bg-[#FFFDF6] p-6">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-[#7A5E14]">
              <ShieldAlert className="h-5 w-5" />
              Catatan Status Prototipe
            </h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#5E4710]">
              <li>
                • <strong>Sesi Aktif:</strong> Masuk sebagai {user?.name} ({user?.role}) menggunakan
                autentikasi demonstrasi, bukan sistem identitas produksi.
              </li>
              <li>
                • <strong>Validasi Instrumen &amp; Aturan:</strong> Pertanyaan skrining dan aturan
                keputusan merupakan rancangan konseptual prototipe yang belum divalidasi secara
                klinis bersama konselor dan mitra layanan lokal.
              </li>
              <li>
                • <strong>CARE Assistant:</strong> Pada tahap prototipe ini menggunakan pencarian
                kata kunci lokal atas dokumen edukasi tersimpan dan belum terhubung ke API LLM
                eksternal.
              </li>
              <li>
                • <strong>Keamanan &amp; Offline Kiosk:</strong> Server prototipe lokal belum
                menerapkan enkripsi disk/TLS tingkat produksi, kebijakan retensi otomatis, maupun
                sinkronisasi antrean luring otomatis.
              </li>
              <li>
                • <strong>Eskalasi Darurat:</strong> Prototipe mencatat permintaan prioritas namun
                tidak terintegrasi ke panggilan 119 atau pengiriman ambulans sungguhan.
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="cb-card p-6">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-[#0E2D24]">
              <Sparkles className="h-5 w-5 text-[#1D65C1]" />
              Dokumen Pengetahuan Lokal CARE Assistant ({docs.length})
            </h2>
            <p className="mt-1 text-xs text-[#47655B]">
              Selain dokumen di bawah, seluruh artikel edukasi berstatus{' '}
              <strong>Dipublikasikan</strong> juga otomatis dicari oleh CARE Assistant.
            </p>
            <div className="mt-4 space-y-2.5">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-[#E6F1EB] bg-[#F8FCFA] p-3.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#135D43]">
                      [{doc.id}] {doc.title}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#47655B]">
                      {doc.category}
                    </span>
                  </div>
                  <p className="mt-1 text-[#47655B]">{doc.content}</p>
                  <p className="mt-1 text-[11px] text-[#6A837B]">Ref: {doc.referenceSource}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Konfirmasi Reset Data Demonstrasi"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#47655B]">
            Seluruh perubahan percobaan di database prototipe akan dikembalikan ke data awal.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setResetOpen(false)}
              className="rounded-xl border border-[#DCEAE3] px-4 py-2 text-sm font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={resetting}
              onClick={handleReset}
              className="rounded-xl bg-[#135D43] px-4 py-2 text-sm font-bold text-white"
            >
              {resetting ? 'Mereset...' : 'Ya, Reset Data'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
