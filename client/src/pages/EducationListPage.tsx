import { useEffect, useState } from 'react';
import { EDUCATION_CATEGORIES } from '@shared/status';
import type { EducationArticle } from '@shared/types';
import { ArrowRight, BookOpen, Clock, Search, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/EmptyState';
import { PrototypeBanner } from '@/components/PrototypeBanner';
import { PublicFooter } from '@/components/PublicFooter';
import { PublicHeader } from '@/components/PublicHeader';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import { api } from '@/services/api';

const QUICK_TOPICS = [
  { label: 'Mengelola Stres', category: 'Teknik sederhana untuk menenangkan diri' },
  { label: 'Dukungan Sosial', category: 'Dukungan sosial berbasis komunitas' },
  { label: 'Pemulihan Emosi', category: 'Mengenali respons stres setelah bencana' },
  { label: 'Keluarga & Anak', category: 'Mendukung keluarga dan orang terdekat' },
  { label: 'Peran Kader', category: 'Peran kader pendamping' },
];

export function EducationListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get('category') || 'all';

  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState('');

  const selectCategory = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  const loadArticles = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.education.list({
        category: selectedCategory,
        search: searchQuery,
      });
      setArticles(res.articles);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat materi edukasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadArticles();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5FBF8]">
      <PrototypeBanner />
      <PublicHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/* Hero Banner Card matching Panel 7 */}
        <section className="overflow-hidden rounded-3xl border border-[#CBE5D7] bg-gradient-to-br from-[#EDF8F2] via-[#F7FCF9] to-[#E1F3EA] p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid items-center gap-8 md:grid-cols-12">
            <div className="space-y-4 md:col-span-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#135D43] shadow-2xs">
                <BookOpen className="h-3.5 w-3.5" />
                Informasi dan Edukasi Psikososial
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0E2D24] sm:text-4xl">
                Pulihkan Diri, Bangkit Bersama
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[#3F5E52]">
                Pelajari cara merawat diri dan orang sekitar setelah bencana. Materi ini disusun
                sebagai panduan edukatif yang aman dan tidak menggantikan bantuan profesional.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href="#daftar-materi"
                  className="cb-kiosk-target inline-flex items-center gap-2 rounded-full bg-[#135D43] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0E4834]"
                >
                  Lihat Materi Lengkap
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  to="/assistant"
                  className="cb-kiosk-target inline-flex items-center gap-2 rounded-full border border-[#CFE3D8] bg-white px-5 py-3 text-sm font-bold text-[#135D43] hover:bg-[#EFF8F3]"
                >
                  <Sparkles className="h-4 w-4" />
                  Tanya CARE Assistant
                </Link>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-[#CBE5D7] bg-[#E8F6EE] shadow-sm">
                <img
                  src="/images/edukasi-breathing.jpg"
                  alt="Ilustrasi wanita berhijab hijau bernapas tenang dan merawat kesehatan emosional"
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Topik Populer Pills matching Panel 7 */}
        <section className="mt-8 space-y-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-lg font-extrabold text-[#0E2D24]">Topik Populer</h2>
            <form onSubmit={handleSearchSubmit} className="flex w-full max-w-sm gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A837B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari panduan atau topik..."
                  className="w-full rounded-xl border border-[#CFE3D8] bg-white py-2 pl-9 pr-3 text-sm text-[#0E2D24]"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-[#135D43] px-4 py-2 text-xs font-bold text-white hover:bg-[#0E4834]"
              >
                Cari
              </button>
            </form>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => selectCategory('all')}
              className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                selectedCategory === 'all'
                  ? 'border-[#135D43] bg-[#135D43] text-white'
                  : 'border-[#DCEAE3] bg-white text-[#2E4D42] hover:bg-[#EFF8F3]'
              }`}
            >
              Semua Topik
            </button>
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic.category}
                type="button"
                onClick={() => selectCategory(topic.category)}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                  selectedCategory === topic.category
                    ? 'border-[#135D43] bg-[#135D43] text-white'
                    : 'border-[#DCEAE3] bg-white text-[#2E4D42] hover:bg-[#EFF8F3]'
                }`}
              >
                {topic.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-[#5B7A6F]">Kategori Lengkap:</span>
            <select
              value={selectedCategory}
              onChange={(e) => selectCategory(e.target.value)}
              aria-label="Filter kategori edukasi"
              className="rounded-xl border border-[#CFE3D8] bg-white px-3 py-1.5 text-xs font-semibold text-[#0E2D24]"
            >
              <option value="all">Semua Kategori (7 Topik Utama)</option>
              {EDUCATION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Article Grid */}
        <section id="daftar-materi" className="mt-6">
          {loading ? (
            <SkeletonRows rows={4} />
          ) : errorMsg ? (
            <ErrorState message={errorMsg} onRetry={loadArticles} />
          ) : articles.length === 0 ? (
            <EmptyState
              title="Materi tidak ditemukan"
              description="Belum ada artikel edukasi yang sesuai dengan kata kunci atau kategori tersebut."
              action={
                <button
                  type="button"
                  onClick={() => {
                    selectCategory('all');
                    setSearchQuery('');
                    loadArticles();
                  }}
                  className="rounded-xl bg-[#135D43] px-4 py-2 text-xs font-bold text-white"
                >
                  Tampilkan Semua Materi
                </button>
              }
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, idx) => (
                <RevealOnScroll key={article.id} delayMs={Math.min(idx * 60, 240)}>
                  <article className="cb-card cb-card-interactive flex h-full flex-col justify-between p-5">
                    <div>
                      <span className="inline-block rounded-full bg-[#E9F6EF] px-3 py-1 text-[11px] font-bold text-[#135D43]">
                        {article.category}
                      </span>
                      <h3 className="mt-3 text-lg font-extrabold leading-snug text-[#0E2D24]">
                        {article.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#47655B]">
                        {article.summary}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-[#EDF5F0] pt-4">
                      <div className="flex items-center justify-between text-xs text-[#5E7C70]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {article.readTimeMinutes} menit baca
                        </span>
                        <span>Oleh {article.authorName}</span>
                      </div>
                      <Link
                        to={`/informasi/${article.slug}`}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#EFF8F3] px-4 py-2.5 text-sm font-bold text-[#135D43] hover:bg-[#135D43] hover:text-white"
                      >
                        Baca Materi Lengkap
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                </RevealOnScroll>
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
