import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function PublicFooter() {
  return (
    <footer className="border-t border-[#DCEAE3] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <BrandLogo compact />
            <p className="max-w-xl text-sm text-[#47655B]">
              Menghubungkan Kepedulian, Menguatkan Pemulihan — Prototipe jembatan layanan konseling
              krisis berbasis komunitas dan dukungan psikososial pascabencana di Aceh.
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg bg-[#EFF8F3] px-3 py-1.5 text-xs font-medium text-[#135D43]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>
                Privasi diminimalkan: tidak meminta NIK atau alamat rumah lengkap. Data simulasi
                disimpan di server demo lokal (enkripsi produksi penuh belum diaktifkan).
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[#2A5344]">
            <Link to="/" className="hover:text-[#135D43] hover:underline">
              Beranda
            </Link>
            <Link to="/skrining" className="hover:text-[#135D43] hover:underline">
              Skrining Mandiri
            </Link>
            <Link to="/informasi" className="hover:text-[#135D43] hover:underline">
              Edukasi Psikososial
            </Link>
            <Link to="/assistant" className="hover:text-[#135D43] hover:underline">
              CARE Assistant
            </Link>
            <Link to="/bantuan" className="hover:text-[#135D43] hover:underline">
              Jalur Bantuan Segera
            </Link>
            <Link to="/masuk" className="hover:text-[#135D43] hover:underline">
              Masuk Petugas (Demo)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
