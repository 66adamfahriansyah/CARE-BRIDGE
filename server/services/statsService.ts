import type { DatabaseSync } from 'node:sqlite';
import { REQUEST_STATUS_META } from '../../shared/status.js';
import type {
  AuditEvent,
  KaderDashboardStats,
  KonselorDashboardStats,
  SupportRequestStatus,
} from '../../shared/types.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function getKaderStats(db: DatabaseSync, kaderId?: string): KaderDashboardStats {
  const rows = kaderId
    ? (db
        .prepare(
          `
          SELECT status, COUNT(*) as total
          FROM support_requests
          WHERE assigned_kader_id = ? OR (service_track = 'kader' AND assigned_kader_id IS NULL)
          GROUP BY status
        `,
        )
        .all(kaderId) as Array<{ status: SupportRequestStatus; total: number }>)
    : (db
        .prepare(
          `
          SELECT status, COUNT(*) as total
          FROM support_requests
          WHERE service_track = 'kader' OR assigned_kader_id IS NOT NULL
          GROUP BY status
        `,
        )
        .all() as Array<{ status: SupportRequestStatus; total: number }>);

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.status] = row.total;
  }

  const activeAssignedCount = kaderId
    ? (
        db
          .prepare(
            `SELECT COUNT(*) as total FROM support_requests
             WHERE assigned_kader_id = ? AND status IN ('dalam_proses', 'perlu_supervisi', 'menunggu_rujukan')`,
          )
          .get(kaderId) as { total: number }
      ).total
    : (counts.dalam_proses ?? 0) + (counts.perlu_supervisi ?? 0);

  return {
    permintaanBaru: counts.baru ?? 0,
    dalamProses: counts.dalam_proses ?? 0,
    perluSupervisi: counts.perlu_supervisi ?? 0,
    selesai: counts.selesai ?? 0,
    activeAssignedCount,
    maxRecommendedCaseload: 5,
    isDemoData: true,
  };
}

export function getKonselorStats(
  db: DatabaseSync,
  monthsWindow = 6,
  categoryFilter?: string,
): KonselorDashboardStats {
  const whereClause = categoryFilter && categoryFilter !== 'all' ? 'WHERE primary_need = ?' : '';
  const params = categoryFilter && categoryFilter !== 'all' ? [categoryFilter] : [];

  const allRequests = db
    .prepare(
      `SELECT id, service_track, status, primary_need, created_at FROM support_requests ${whereClause}`,
    )
    .all(...params) as Array<{
    id: string;
    service_track: string;
    status: SupportRequestStatus;
    primary_need: string;
    created_at: string;
  }>;

  const activeSupervisions = (
    db
      .prepare(
        `SELECT COUNT(*) as total FROM supervision_requests WHERE status IN ('menunggu', 'ditinjau')`,
      )
      .get() as { total: number }
  ).total;

  const activeReferrals = (
    db
      .prepare(
        `SELECT COUNT(*) as total FROM referral_records WHERE status IN ('direncanakan', 'dikonfirmasi')`,
      )
      .get() as { total: number }
  ).total;

  const permintaanLayanan = allRequests.filter(
    (r) =>
      (r.service_track === 'konselor' || r.service_track === 'bantuan_segera') &&
      r.status !== 'selesai',
  ).length;

  const kasusLanjutan = allRequests.filter(
    (r) => r.status === 'dalam_proses' || r.status === 'menunggu_rujukan',
  ).length;

  const totalSelesai = allRequests.filter((r) => r.status === 'selesai').length;

  // Compute monthly trend directly from stored records
  const now = new Date();
  const buckets: Array<{
    key: string;
    month: string;
    permintaan: number;
    supervisi: number;
    selesai: number;
  }> = [];

  for (let i = monthsWindow - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({
      key,
      month: MONTH_NAMES[d.getMonth()],
      permintaan: 0,
      supervisi: 0,
      selesai: 0,
    });
  }

  for (const r of allRequests) {
    const key = r.created_at.slice(0, 7);
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) {
      bucket.permintaan += 1;
      if (r.status === 'selesai') {
        bucket.selesai += 1;
      }
    }
  }

  const allSupervisions = db
    .prepare('SELECT created_at FROM supervision_requests')
    .all() as Array<{ created_at: string }>;

  for (const s of allSupervisions) {
    const key = s.created_at.slice(0, 7);
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) {
      bucket.supervisi += 1;
    }
  }

  // Category breakdown
  const catMap = new Map<string, number>();
  for (const r of allRequests) {
    catMap.set(r.primary_need, (catMap.get(r.primary_need) ?? 0) + 1);
  }
  const categoryBreakdown = Array.from(catMap.entries()).map(([category, total]) => ({
    category,
    total,
  }));

  // Status breakdown
  const statusOrder: SupportRequestStatus[] = [
    'baru',
    'dalam_proses',
    'perlu_supervisi',
    'menunggu_rujukan',
    'selesai',
  ];
  const statusBreakdown = statusOrder.map((st) => ({
    status: st,
    label: REQUEST_STATUS_META[st].label,
    total: allRequests.filter((r) => r.status === st).length,
  }));

  const recentActivitiesRows = db
    .prepare(
      `SELECT id, actor_id, actor_name, actor_role, action, entity_type, entity_id, detail, created_at
       FROM audit_events
       ORDER BY created_at DESC
       LIMIT 8`,
    )
    .all() as Array<{
    id: string;
    actor_id: string | null;
    actor_name: string;
    actor_role: string;
    action: string;
    entity_type: string;
    entity_id: string;
    detail: string;
    created_at: string;
  }>;

  const recentActivities: AuditEvent[] = recentActivitiesRows.map((a) => ({
    id: a.id,
    actorId: a.actor_id,
    actorName: a.actor_name,
    actorRole: a.actor_role,
    action: a.action,
    entityType: a.entity_type,
    entityId: a.entity_id,
    detail: a.detail,
    createdAt: a.created_at,
  }));

  const followedUpCount = allRequests.filter((r) => r.status !== 'baru').length;
  const followedUpRatePercent =
    allRequests.length > 0 ? Math.round((followedUpCount / allRequests.length) * 100) : 0;
  const supervisionTotal = allSupervisions.length;
  const supervisionHandledCount = (
    db
      .prepare(
        `SELECT COUNT(*) as total FROM supervision_requests WHERE status IN ('arahan_dikirim', 'selesai')`,
      )
      .get() as { total: number }
  ).total;
  const referralTotal = (
    db.prepare('SELECT COUNT(*) as total FROM referral_records').get() as { total: number }
  ).total;
  const referralConfirmedOrDoneCount = (
    db
      .prepare(
        `SELECT COUNT(*) as total FROM referral_records WHERE status IN ('dikonfirmasi', 'selesai')`,
      )
      .get() as { total: number }
  ).total;
  const aiErrorReportsCount = (
    db
      .prepare(`SELECT COUNT(*) as total FROM audit_events WHERE action = 'ai_error_report'`)
      .get() as { total: number }
  ).total;

  return {
    permintaanLayanan,
    supervisiKader: activeSupervisions,
    kasusLanjutan,
    rujukanDiproses: activeReferrals,
    totalSelesai,
    monthlyTrend: buckets.map(({ month, permintaan, supervisi, selesai }) => ({
      month,
      permintaan,
      supervisi,
      selesai,
    })),
    categoryBreakdown,
    statusBreakdown,
    processEvaluation: {
      totalRequests: allRequests.length,
      followedUpRatePercent,
      supervisionTotal,
      supervisionHandledCount,
      referralTotal,
      referralConfirmedOrDoneCount,
      aiErrorReportsCount,
      interpretationNote:
        'Indikator mutu proses simulasi: mengukur keterlaksanaan tindak lanjut, supervisi, dan rujukan; bukan bukti efektivitas klinis maupun ukuran kesembuhan.',
    },
    recentActivities,
    isDemoData: true,
  };
}
