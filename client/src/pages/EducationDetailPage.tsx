import { useEffect, useState } from 'react';
import type { EducationArticle } from '@shared/types';
import { ArrowLeft, BookMarked, Calendar, Clock, HeartHandshake } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorState, SkeletonRows } from '@/components/EmptyState';
import { PrototypeBanner } from '@/components/PrototypeBanner';
import { PublicFooter } from '@/components/PublicFooter';
import { PublicHeader } from '@/components/PublicHeader';
import { QuickHelpModal } from '@/components/QuickHelpModal';
import { api } from '@/services/api';

export function EducationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<EducationArticle | null>(null);
  const [related, setRelated] = useState<EducationArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [quickHelpOpen, setQuickHelpOpen] = useState(false);

  const loadDetail = async () => {
    if (!slug) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.education.getBySlug(slug);
      setArticle(res.article);
      setRelated(res.related);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Materi edukasi tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F5FBF8]">
      <PrototypeBanner />
      <PublicHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/informasi')}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#DCEAE3] bg-white px-4 py-2 text-sm font-bold text-[#135D43] hover:bg-[#EFF8F3]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Edukasi
        </button>

        {loading ? (
          <SkeletonRows rows={5} />
        ) : errorMsg || !article ? (
          <ErrorState message={errorMsg || 'Artikel tidak tersedia.'} onRetry={loadDetail} />
        ) : (
          <div className="space-y-8">
            <article className="cb-card-elevated p-6 sm:p-10">
              <span className="inline-block rounded-full bg-[#E9F6EF] px-3.5 py-1 text-xs font-bold text-[#135D43]">
                {article.category}
              </span>

              <h1 className="mt-4 text-2xl font-extrabold leading-tight text-[#0E2D24] sm:text-3xl">
                {article.title}
              </h1>

              <p className="mt-3 text-base leading-relaxed text-[#425F54]">{article.summary}</p>

              <div className="mt-4 flex flex-wrap items-center gap-4 border-y border-[#EAF2EE] py-3 text-xs font-medium text-[#5B7A6F]">
                <span>Disusun oleh: {article.authorName}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {article.readTimeMinutes} menit baca
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Diperbarui {new Date(article.updatedAt).toLocaleDateString('id-ID')}
                </span>
              </div>

              <div className="mt-6 space-y-4 whitespace-pre-line text-base leading-relaxed text-[#1A382E]">
                {article.content}
              </div>

              <div className="mt-8 rounded-2xl border border-[#CFE3D8] bg-[#F5FBF8] p-4">
                <div className="flex items-start gap-2.5 text-xs text-[#2D5043]">
                  <BookMarked className="mt-0.5 h-4 w-4 shrink-0 text-[#135D43]" />
                  <div>
                    <p className="font-bold">Sumber Referensi:</p>
                    <p className="mt-0.5">{article.referenceSource}</p>
                    <p className="mt-1.5 text-[#58766B]">
                      Disclaimer: Konten edukasi ini bersifat informatif dan tidak menggantikan
                      evaluasi atau konseling oleh tenaga kesehatan jiwa profesional.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#ECF8F1] p-4">
                <p className="text-sm font-semibold text-[#114432]">
                  Ingin berbicara langsung dengan relawan pendamping di posko?
                </p>
                <button
                  type="button"
                  onClick={() => setQuickHelpOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#135D43] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0E4834]"
                >
                  <HeartHandshake className="h-4 w-4" />
                  Saya Membutuhkan Pendamping
                </button>
              </div>
            </article>

            {related.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-extrabold text-[#0E2D24]">Materi Terkait</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      to={`/informasi/${item.slug}`}
                      className="cb-card p-4 hover:border-[#1B8A5A]"
                    >
                      <span className="text-[11px] font-bold text-[#135D43]">{item.category}</span>
                      <h3 className="mt-1 text-sm font-bold text-[#0E2D24]">{item.title}</h3>
                      <p className="mt-1.5 line-clamp-2 text-xs text-[#47655B]">{item.summary}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <PublicFooter />
      <QuickHelpModal open={quickHelpOpen} onClose={() => setQuickHelpOpen(false)} />
    </div>
  );
}
