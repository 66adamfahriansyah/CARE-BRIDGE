import { useCallback, useEffect, useState } from 'react';
import type { KonselorDashboardStats } from '@shared/types';
import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ErrorState, SkeletonRows } from '@/components/EmptyState';
import { api } from '@/services/api';

export function KonselorStatistikPage() {
  const [stats, setStats] = useState<KonselorDashboardStats | null>(null);
  const [months, setMonths] = useState<6 | 12>(6);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.stats.konselor({ months, category });
      setStats(res);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat statistik layanan.');
    } finally {
      setLoading(false);
    }
  }, [months, category]);

  useEffect(() => {
    loadStats();
    const onReset = () => loadStats();
    window.addEventListener('cb:demo-reset', onReset);
    return () => window.removeEventListener('cb:demo-reset', onReset);
  }, [loadStats]);

  return (
    <DashboardLayout
      title="Statistik & Analitik Layanan (Data Demonstrasi)"
      subtitle="Seluruh angka dihitung langsung dari catatan yang tersimpan pada penyimpanan data prototipe"
      onDemoReset={loadStats}
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="cb-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#135D43]">
            <BarChart3 className="h-4 w-4" />
            <span>Sumber Data: Simulasi Prototipe CARE BRIDGE (Real-Time Aggregation)</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value) === 12 ? 12 : 6)}
              aria-label="Filter periode bulan"
              className="rounded-xl border border-[#CFE3D8] bg-white px-3 py-2 text-xs font-semibold"
            >
              <option value={6}>6 Bulan Terakhir</option>
              <option value={12}>12 Bulan Terakhir</option>
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter kategori kebutuhan"
              className="rounded-xl border border-[#CFE3D8] bg-white px-3 py-2 text-xs font-semibold"
            >
              <option value="all">Semua Kategori Kebutuhan</option>
              <option value="Dukungan emosional">Dukungan emosional</option>
              <option value="Informasi & edukasi">Informasi &amp; edukasi</option>
              <option value="Pendampingan lanjutan">Pendampingan lanjutan</option>
              <option value="Konseling profesional">Konseling profesional</option>
            </select>
          </div>
        </div>

        {loading ? (
          <SkeletonRows rows={4} />
        ) : errorMsg || !stats ? (
          <ErrorState message={errorMsg || 'Data statistik gagal dimuat.'} onRetry={loadStats} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="cb-card p-5">
              <h2 className="text-base font-extrabold text-[#0E2D24]">
                Tren Bulanan Permintaan, Supervisi, &amp; Penyelesaian
              </h2>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6F1EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="permintaan"
                      name="Permintaan"
                      stroke="#135D43"
                      strokeWidth={2.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="supervisi"
                      name="Supervisi"
                      stroke="#7C3AED"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="selesai"
                      name="Selesai"
                      stroke="#1D65C1"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="cb-card p-5">
              <h2 className="text-base font-extrabold text-[#0E2D24]">
                Distribusi Status Kasus Tersimpan
              </h2>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.statusBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6F1EB" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Jumlah Kasus" fill="#1B8A5A" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="cb-card p-5 lg:col-span-2">
              <h2 className="text-base font-extrabold text-[#0E2D24]">
                Rekapitulasi Jenis Kebutuhan Penyintas
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.categoryBreakdown.map((item) => (
                  <div
                    key={item.category}
                    className="rounded-xl border border-[#DCEAE3] bg-[#F8FCFA] p-4"
                  >
                    <p className="text-2xl font-extrabold text-[#135D43]">{item.total}</p>
                    <p className="mt-1 text-xs font-semibold text-[#28473D]">{item.category}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Process Evaluation Metrics matching ESAI.docx Lampiran 9 Tabel 8 */}
            <div className="cb-card border-[#CFE3D8] bg-[#F7FCF9] p-5 lg:col-span-2">
              <h2 className="text-base font-extrabold text-[#0E2D24]">
                Indikator Mutu Proses Layanan
              </h2>
              <p className="mt-1 text-xs text-[#47655B]">
                {stats.processEvaluation.interpretationNote}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[#DCEAE3] bg-white p-4">
                  <p className="text-2xl font-extrabold text-[#135D43]">
                    {stats.processEvaluation.followedUpRatePercent}%
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#28473D]">
                    Proporsi Permintaan Ditindaklanjuti ({stats.processEvaluation.totalRequests} total)
                  </p>
                </div>
                <div className="rounded-xl border border-[#DCEAE3] bg-white p-4">
                  <p className="text-2xl font-extrabold text-[#6D28D9]">
                    {stats.processEvaluation.supervisionHandledCount} /{' '}
                    {stats.processEvaluation.supervisionTotal}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#28473D]">
                    Permintaan Supervisi Kader Tertangani
                  </p>
                </div>
                <div className="rounded-xl border border-[#DCEAE3] bg-white p-4">
                  <p className="text-2xl font-extrabold text-[#1D65C1]">
                    {stats.processEvaluation.referralConfirmedOrDoneCount} /{' '}
                    {stats.processEvaluation.referralTotal}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#28473D]">
                    Rujukan Terkonfirmasi / Selesai (Bukan Ukuran Kesembuhan)
                  </p>
                </div>
                <div className="rounded-xl border border-[#DCEAE3] bg-white p-4">
                  <p className="text-2xl font-extrabold text-[#C2610C]">
                    {stats.processEvaluation.aiErrorReportsCount}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#28473D]">
                    Laporan Koreksi CARE Assistant Masuk
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
