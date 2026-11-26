import { useCallback, useEffect, useState } from 'react';
import type { KonselorDashboardStats } from '@shared/types';
import {
  Activity,
  ArrowRight,
  ClipboardList,
  FolderKanban,
  Share2,
  Stethoscope,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ErrorState, SkeletonRows } from '@/components/EmptyState';
import { KpiCard } from '@/components/KpiCard';
import { api } from '@/services/api';
import { formatRelativeTime } from '@/utils/formatTime';

export function KonselorDashboardPage() {
  const [stats, setStats] = useState<KonselorDashboardStats | null>(null);
  const [months, setMonths] = useState<6 | 12>(6);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.stats.konselor({ months });
      setStats(res);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat dashboard konselor.');
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    loadStats();
    const onReset = () => loadStats();
    window.addEventListener('cb:demo-reset', onReset);
    return () => window.removeEventListener('cb:demo-reset', onReset);
  }, [loadStats]);

  const activityTone = (action: string) => {
    if (action.includes('rujukan')) return 'bg-[#F3E8FF] text-[#6D28D9]';
    if (action.includes('supervisi')) return 'bg-[#E7F7EE] text-[#15803D]';
    return 'bg-[#EBF4FF] text-[#1D65C1]';
  };

  return (
    <DashboardLayout
      title="Dashboard Konselor Profesional"
      subtitle="Koordinasi layanan konseling, supervisi kader, dan rujukan fasilitas kesehatan (Data Simulasi)"
      onDemoReset={loadStats}
    >
      {loading ? (
        <SkeletonRows rows={5} />
      ) : errorMsg || !stats ? (
        <ErrorState message={errorMsg || 'Statistik tidak tersedia.'} onRetry={loadStats} />
      ) : (
        <div className="cb-step-enter space-y-6">
          {/* KPI Summary Row matching Panel 6 */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Permintaan Layanan"
              value={stats.permintaanLayanan}
              icon={ClipboardList}
              tone="blue"
            />
            <KpiCard
              label="Supervisi Kader"
              value={stats.supervisiKader}
              icon={Stethoscope}
              tone="amber"
            />
            <KpiCard
              label="Kasus Lanjutan"
              value={stats.kasusLanjutan}
              icon={FolderKanban}
              tone="green"
            />
            <KpiCard
              label="Rujukan Diproses"
              value={stats.rujukanDiproses}
              icon={Share2}
              tone="purple"
            />
          </section>

          {/* 2-Column Charts & Activity matching Panel 6 */}
          <section className="grid gap-6 lg:grid-cols-12">
            {/* Statistik Layanan Chart */}
            <div className="cb-card p-5 sm:p-6 lg:col-span-7">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-[#0E2D24] sm:text-lg">
                    Statistik Layanan
                  </h2>
                  <p className="text-xs text-[#5B7A6F]">
                    Dihitung dari catatan prototipe tersimpan (Data Demonstrasi)
                  </p>
                </div>
                <select
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value) === 12 ? 12 : 6)}
                  aria-label="Pilih rentang bulan statistik"
                  className="rounded-xl border border-[#CFE3D8] bg-[#F8FCFA] px-3 py-1.5 text-xs font-semibold text-[#0E2D24]"
                >
                  <option value={6}>6 Bulan Terakhir</option>
                  <option value={12}>12 Bulan Terakhir</option>
                </select>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.monthlyTrend}
                    margin={{ top: 10, right: 16, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="cbGreenArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B8A5A" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#1B8A5A" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6F1EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#47655B' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#47655B' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        borderColor: '#CFE3D8',
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="permintaan"
                      name="Permintaan Masuk"
                      stroke="#1B8A5A"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#cbGreenArea)"
                      dot={{ r: 4, fill: '#135D43' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="selesai"
                      name="Kasus Selesai"
                      stroke="#1D65C1"
                      strokeWidth={2}
                      fillOpacity={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Aktivitas Terbaru matching Panel 6 */}
            <div className="cb-card flex flex-col justify-between p-5 sm:p-6 lg:col-span-5">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-[#0E2D24] sm:text-lg">
                    Aktivitas Terbaru
                  </h2>
                  <Link
                    to="/konselor/tindak-lanjut"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1D65C1] hover:underline"
                  >
                    Lihat Semua
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="space-y-3.5">
                  {stats.recentActivities.slice(0, 5).map((act) => (
                    <div key={act.id} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${activityTone(
                          act.action,
                        )}`}
                      >
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#0E2D24]">{act.detail}</p>
                        <p className="text-xs text-[#6A837B]">{formatRelativeTime(act.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#EAF2EE] pt-4">
                <Link
                  to="/konselor/supervisi"
                  className="rounded-xl bg-[#F4EEFF] px-3 py-2 text-center text-xs font-bold text-[#6D28D9] hover:bg-[#EAE0FF]"
                >
                  Antrean Supervisi ({stats.supervisiKader})
                </Link>
                <Link
                  to="/konselor/permintaan"
                  className="rounded-xl bg-[#ECF8F1] px-3 py-2 text-center text-xs font-bold text-[#135D43] hover:bg-[#DCF0E4]"
                >
                  Tinjau Permintaan
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
