import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SupportRequest, SupportRequestStatus } from '@shared/types';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { formatRelativeTime } from '@/utils/formatTime';

const PAGE_SIZE = 6;

export function KaderPendampinganListPage() {
  const { showToast } = useToast();

  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [needFilter, setNeedFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);

  const loadList = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.requests.list();
      setRequests(res.requests);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat daftar pendampingan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
    const onReset = () => loadList();
    window.addEventListener('cb:demo-reset', onReset);
    return () => window.removeEventListener('cb:demo-reset', onReset);
  }, [loadList]);

  const needOptions = useMemo(() => {
    const set = new Set(requests.map((r) => r.primaryNeed));
    return Array.from(set);
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== (statusFilter as SupportRequestStatus)) {
        return false;
      }
      if (needFilter !== 'all' && r.primaryNeed !== needFilter) {
        return false;
      }
      if (q) {
        const hay = `${r.anonymousCode} ${r.primaryNeed} ${r.needSummary} ${r.locationPost}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? -diff : diff;
    });
    return list;
  }, [requests, search, statusFilter, needFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAccept = async (req: SupportRequest) => {
    try {
      await api.requests.accept(req.id);
      showToast(`Permintaan ${req.anonymousCode} diterima`);
      await loadList();
    } catch (err) {
      showToast('Gagal menerima permintaan', {
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    }
  };

  return (
    <DashboardLayout
      title="Daftar Pendampingan Kader"
      subtitle="Cari, saring, dan tindak lanjuti seluruh permintaan pendampingan dalam kewenangan Anda"
      onDemoReset={loadList}
    >
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="cb-card flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A837B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari kode anonim, kebutuhan, atau posko..."
              className="w-full rounded-xl border border-[#CFE3D8] bg-[#F8FCFA] py-2 pl-9 pr-3 text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter status"
            className="rounded-xl border border-[#CFE3D8] bg-white px-3 py-2 text-xs font-semibold"
          >
            <option value="all">Semua Status</option>
            <option value="baru">Baru</option>
            <option value="dalam_proses">Dalam Proses</option>
            <option value="perlu_supervisi">Perlu Supervisi</option>
            <option value="menunggu_rujukan">Menunggu Rujukan</option>
            <option value="selesai">Selesai</option>
          </select>

          <select
            value={needFilter}
            onChange={(e) => {
              setNeedFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter jenis kebutuhan"
            className="rounded-xl border border-[#CFE3D8] bg-white px-3 py-2 text-xs font-semibold"
          >
            <option value="all">Semua Kebutuhan</option>
            {needOptions.map((need) => (
              <option key={need} value={need}>
                {need}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setSortOrder((s) => (s === 'newest' ? 'oldest' : 'newest'))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#CFE3D8] bg-white px-3 py-2 text-xs font-semibold text-[#135D43] hover:bg-[#EFF8F3]"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortOrder === 'newest' ? 'Terbaru' : 'Terlama'}
          </button>
        </div>

        {loading ? (
          <SkeletonRows rows={5} />
        ) : errorMsg ? (
          <ErrorState message={errorMsg} onRetry={loadList} />
        ) : pagedRows.length === 0 ? (
          <EmptyState
            title="Tidak ada data yang cocok"
            description="Coba ubah filter status atau kata kunci pencarian."
            action={
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setNeedFilter('all');
                }}
                className="rounded-xl bg-[#135D43] px-4 py-2 text-xs font-bold text-white"
              >
                Reset Filter
              </button>
            }
          />
        ) : (
          <div className="cb-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-[#EAF2EE] bg-[#F8FCFA] text-xs font-bold text-[#47655B]">
                  <tr>
                    <th className="px-5 py-3.5">Identitas Anonim</th>
                    <th className="px-5 py-3.5">Kebutuhan &amp; Posko</th>
                    <th className="px-5 py-3.5">Waktu</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFF6F2]">
                  {pagedRows.map((req) => (
                    <tr key={req.id} className="hover:bg-[#F9FDFB]">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#0E2D24]">{req.anonymousCode}</div>
                        <div className="text-xs text-[#5B7A6F]">{req.displayName}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#113D2E]">{req.primaryNeed}</div>
                        <div className="text-xs text-[#5B7A6F]">{req.locationPost}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#5B7A6F]">
                        {formatRelativeTime(req.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {req.status === 'baru' && (
                            <button
                              type="button"
                              onClick={() => handleAccept(req)}
                              className="rounded-lg bg-[#135D43] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0E4834]"
                            >
                              Terima
                            </button>
                          )}
                          <Link
                            to={`/kader/pendampingan/${req.id}`}
                            className="rounded-lg border border-[#CFE3D8] bg-white px-3 py-1.5 text-xs font-bold text-[#135D43] hover:bg-[#EFF8F3]"
                          >
                            Buka Detail
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#EAF2EE] px-5 py-3 text-xs text-[#47655B]">
                <span>
                  Halaman {page} dari {totalPages} ({filtered.length} data)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#DCEAE3] px-2.5 py-1 font-semibold disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#DCEAE3] px-2.5 py-1 font-semibold disabled:opacity-40"
                  >
                    Berikutnya
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
