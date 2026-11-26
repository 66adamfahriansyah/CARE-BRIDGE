import { useEffect, useState } from 'react';
import type { EducationArticle } from '@shared/types';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ErrorState, SkeletonRows } from '@/components/EmptyState';
import { api } from '@/services/api';

export function KaderEdukasiPage() {
  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadArticles = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.education.list();
      setArticles(res.articles);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat materi edukasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  return (
    <DashboardLayout
      title="Panduan Edukasi Lapangan Kader"
      subtitle="Materi psikoedukasi terpublikasi untuk dibagikan saat pendampingan komunitas"
      onDemoReset={loadArticles}
    >
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={loadArticles} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((art) => (
            <div key={art.id} className="cb-card flex flex-col justify-between p-5">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E9F6EF] px-2.5 py-1 text-[11px] font-bold text-[#135D43]">
                  <BookOpen className="h-3 w-3" />
                  {art.category}
                </span>
                <h2 className="mt-3 text-base font-extrabold text-[#0E2D24]">{art.title}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[#47655B]">{art.summary}</p>
              </div>

              <Link
                to={`/informasi/${art.slug}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#135D43] hover:underline"
              >
                Buka Artikel Lengkap
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
