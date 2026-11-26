import { useCallback, useEffect, useState } from 'react';
import { EDUCATION_CATEGORIES } from '@shared/status';
import type { ArticleStatus, EducationArticle } from '@shared/types';
import {
  BookOpen,
  Edit3,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';

interface ArticleFormState {
  title: string;
  summary: string;
  content: string;
  category: string;
  referenceSource: string;
  status: ArticleStatus;
  readTimeMinutes: number;
}

const EMPTY_FORM: ArticleFormState = {
  title: '',
  summary: '',
  content: '',
  category: EDUCATION_CATEGORIES[0],
  referenceSource: '',
  status: 'published',
  readTimeMinutes: 4,
};

export function KonselorMateriPage() {
  const { showToast } = useToast();

  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<EducationArticle | null>(null);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.education.list({ includeDrafts: true });
      setArticles(res.articles);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat materi edukasi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
    const onReset = () => loadArticles();
    window.addEventListener('cb:demo-reset', onReset);
    return () => window.removeEventListener('cb:demo-reset', onReset);
  }, [loadArticles]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (article: EducationArticle) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category,
      referenceSource: article.referenceSource,
      status: article.status,
      readTimeMinutes: article.readTimeMinutes,
    });
    setEditorOpen(true);
  };

  const handleSave = async (targetStatus: ArticleStatus) => {
    if (
      form.title.trim().length < 5 ||
      form.summary.trim().length < 10 ||
      form.content.trim().length < 40 ||
      form.referenceSource.trim().length < 3
    ) {
      showToast('Lengkapi judul, ringkasan, isi (min. 40 karakter), dan sumber referensi', {
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, status: targetStatus };
      if (editingId) {
        await api.education.update(editingId, payload);
        showToast(
          targetStatus === 'published'
            ? 'Materi diperbarui & dipublikasikan ke halaman Edukasi serta CARE Assistant'
            : 'Materi disimpan sebagai draf',
        );
      } else {
        await api.education.create(payload);
        showToast(
          targetStatus === 'published'
            ? 'Materi baru dipublikasikan ke halaman Edukasi & CARE Assistant'
            : 'Draf materi baru disimpan',
        );
      }
      setEditorOpen(false);
      await loadArticles();
    } catch (err) {
      showToast('Gagal menyimpan materi', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (article: EducationArticle) => {
    const nextStatus: ArticleStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      await api.education.update(article.id, {
        title: article.title,
        summary: article.summary,
        content: article.content,
        category: article.category,
        referenceSource: article.referenceSource,
        status: nextStatus,
        readTimeMinutes: article.readTimeMinutes,
      });
      showToast(
        nextStatus === 'published'
          ? 'Materi dipublikasikan dan kini terlihat oleh publik & CARE Assistant'
          : 'Materi dikembalikan menjadi Draf',
      );
      await loadArticles();
    } catch (err) {
      showToast('Gagal mengubah status materi', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.education.delete(deleteTarget.id);
      showToast(`Materi "${deleteTarget.title}" berhasil dihapus`);
      setDeleteTarget(null);
      await loadArticles();
    } catch (err) {
      showToast('Gagal menghapus materi', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Manajemen Materi Edukasi Psikososial"
      subtitle="Materi yang dipublikasikan otomatis tampil di halaman Informasi Publik dan dapat ditemukan oleh CARE Assistant"
      onDemoReset={loadArticles}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium text-[#47655B]">
            Total {articles.length} materi ({articles.filter((a) => a.status === 'published').length}{' '}
            terbit, {articles.filter((a) => a.status === 'draft').length} draf)
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#135D43] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0E4834]"
          >
            <Plus className="h-4 w-4" />
            Buat Materi Baru
          </button>
        </div>

        {loading ? (
          <SkeletonRows rows={4} />
        ) : errorMsg ? (
          <ErrorState message={errorMsg} onRetry={loadArticles} />
        ) : articles.length === 0 ? (
          <EmptyState
            title="Belum ada materi edukasi"
            description="Buat materi edukasi pertama agar penyintas dan CARE Assistant dapat mengakses panduan terpercaya."
          />
        ) : (
          <div className="space-y-3">
            {articles.map((art) => (
              <div key={art.id} className="cb-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          art.status === 'published'
                            ? 'bg-[#E7F7EE] text-[#15803D]'
                            : 'bg-[#FFF4E5] text-[#C2610C]'
                        }`}
                      >
                        {art.status === 'published' ? 'Dipublikasikan' : 'Draf'}
                      </span>
                      <span className="rounded-full bg-[#EFF8F3] px-2.5 py-0.5 text-[11px] font-semibold text-[#135D43]">
                        {art.category}
                      </span>
                    </div>
                    <h2 className="mt-2 text-base font-extrabold text-[#0E2D24]">{art.title}</h2>
                    <p className="mt-1 text-xs text-[#47655B]">{art.summary}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#5E7C70]">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      Sumber Referensi: {art.referenceSource}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {art.status === 'published' && (
                      <Link
                        to={`/informasi/${art.slug}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#DCEAE3] px-3 py-1.5 text-xs font-semibold text-[#135D43] hover:bg-[#EFF8F3]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Lihat Publik
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(art)}
                      className="rounded-lg border border-[#CFE3D8] bg-white px-3 py-1.5 text-xs font-bold text-[#135D43] hover:bg-[#EFF8F3]"
                    >
                      {art.status === 'published' ? 'Jadikan Draf' : 'Publikasikan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(art)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#DCEAE3] bg-white px-3 py-1.5 text-xs font-bold text-[#28473D] hover:bg-[#F5FBF8]"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(art)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#F5C2C2] bg-[#FFF6F6] px-3 py-1.5 text-xs font-bold text-[#C93434] hover:bg-[#FDECEC]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Edit Materi Edukasi' : 'Buat Materi Edukasi Baru'}
        description="Gunakan bahasa yang hangat, informatif, dan cantumkan sumber referensi yang jelas."
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">Judul Materi</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Contoh: Teknik Relaksasi Otot Ringan untuk Warga Posko"
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] px-3.5 py-2 text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#0E2D24]">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#CFE3D8] bg-white px-3 py-2 text-sm"
              >
                {EDUCATION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0E2D24]">
                Estimasi Waktu Baca (Menit)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={form.readTimeMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, readTimeMinutes: Number(e.target.value) || 4 }))
                }
                className="mt-1 w-full rounded-xl border border-[#CFE3D8] px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">Ringkasan Singkat</label>
            <textarea
              rows={2}
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="Ringkasan 1-2 kalimat yang mudah dipahami..."
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] p-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">Isi Artikel Lengkap</label>
            <textarea
              rows={6}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Tuliskan panduan langkah demi langkah secara empatik dan non-diagnostik..."
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] p-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0E2D24]">Sumber Referensi</label>
            <input
              type="text"
              value={form.referenceSource}
              onChange={(e) => setForm((f) => ({ ...f, referenceSource: e.target.value }))}
              placeholder="Contoh: WHO Psychological First Aid Guide / Kemenkes RI"
              className="mt-1 w-full rounded-xl border border-[#CFE3D8] px-3.5 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#EAF2EE] pt-4">
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="rounded-xl border border-[#DCEAE3] px-4 py-2 text-sm font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('draft')}
              className="rounded-xl border border-[#CFE3D8] bg-[#F5FBF8] px-4 py-2 text-sm font-bold text-[#135D43] hover:bg-[#E7F4EC]"
            >
              Simpan sebagai Draf
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('published')}
              className="rounded-xl bg-[#135D43] px-5 py-2 text-sm font-bold text-white hover:bg-[#0E4834]"
            >
              {saving ? 'Menyimpan...' : 'Publikasikan Sekarang'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus Materi Edukasi"
        description="Materi yang dihapus tidak akan tampil lagi di halaman publik maupun pencarian CARE Assistant."
      >
        <div className="space-y-4">
          <p className="rounded-xl bg-[#FFF4F4] p-3 text-sm font-semibold text-[#9E1F1F]">
            Apakah Anda yakin ingin menghapus materi "{deleteTarget?.title}"?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-[#DCEAE3] px-4 py-2 text-sm font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-[#D92D20] px-4 py-2 text-sm font-bold text-white hover:bg-[#B42318]"
            >
              Ya, Hapus Materi
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
