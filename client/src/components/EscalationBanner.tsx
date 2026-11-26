import { AlertCircle, ArrowRight, MapPin, PhoneCall, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EscalationBanner({
  compact = false,
  hideBantuanLink = false,
}: {
  compact?: boolean;
  hideBantuanLink?: boolean;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border-2 border-[#E66767] bg-[#FFF3F3] p-5 text-[#6E1717] shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D92D20] text-white">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#D92D20] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              Bantuan Segera
            </span>
            <h3 className="text-lg font-extrabold text-[#7A1818]">
              Segera Hubungi Petugas atau Layanan Darurat
            </h3>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-[#6E1717]">
            Jika Anda atau orang di sekitar Anda berada dalam kondisi darurat, bahaya langsung,
            atau membutuhkan pertolongan segera, jangan menunggu formulir selesai atau balasan
            chatbot.
          </p>

          <div className={`mt-4 grid gap-3 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-3'}`}>
            <div className="rounded-xl border border-[#F5C2C2] bg-white p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#B42318]">
                <PhoneCall className="h-4 w-4" />
                Darurat Medis & Krisis
              </div>
              <p className="mt-1 text-lg font-extrabold text-[#0E2D24]">119 / 112</p>
              <p className="text-xs text-[#5B3B3B]">Layanan Gawat Darurat Nasional (Indonesia)</p>
            </div>

            <div className="rounded-xl border border-[#F5C2C2] bg-white p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#B42318]">
                <MapPin className="h-4 w-4" />
                Posko Utama Aceh
              </div>
              <p className="mt-1 text-sm font-bold text-[#0E2D24]">
                Meja Siaga Psikososial & BPBA
              </p>
              <p className="text-xs text-[#5B3B3B]">
                Temui langsung petugas berseragam hijau / relawan di tenda kesehatan posko terdekat.
              </p>
            </div>

            {!compact && (
              <div className="rounded-xl border border-[#F5C2C2] bg-white p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#B42318]">
                  <ShieldAlert className="h-4 w-4" />
                  Catatan Prototipe
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#5B3B3B]">
                  Aplikasi prototipe ini <strong>tidak</strong> otomatis mengirim ambulans atau
                  menghubungi petugas lapangan secara real-time. Hubungi langsung nomor atau petugas
                  di atas.
                </p>
              </div>
            )}
          </div>

          {!hideBantuanLink && (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/bantuan"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D92D20] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#B42318]"
              >
                Lihat Daftar Kontak & Jalur Eskalasi Lengkap
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
