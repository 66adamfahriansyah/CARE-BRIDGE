import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/PublicHeader';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5FBF8]">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="cb-card max-w-md p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E9F6EF] text-[#135D43]">
            <Compass className="h-7 w-7" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#1B8A5A]">404</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#0E2D24]">Halaman Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-[#47655B]">
            Tautan yang Anda tuju tidak tersedia atau telah dipindahkan.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#135D43] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0E4834]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    </div>
  );
}
