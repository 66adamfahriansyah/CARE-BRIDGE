import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import type {
  FollowUpRecord,
  ReferralRecord,
  Role,
  SupervisionRequest,
  SupportRequest,
  SupportRequestStatus,
} from '../../shared/types.js';
import { followUpCreateSchema } from '../../shared/validation.js';
import { getDb, queryAll, queryOne, withTransaction } from '../db/database.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { logAuditEvent } from '../services/audit.js';

export const requestsRouter = Router();

interface RawRequestRow {
  id: string;
  screening_session_id: string | null;
  anonymous_code: string;
  display_name: string;
  age_range: string;
  location_post: string;
  contact_allowed: number;
  contact_info: string | null;
  primary_need: string;
  need_summary: string;
  activity_difficulty: string;
  social_support_info: string;
  service_track: SupportRequest['serviceTrack'];
  status: SupportRequestStatus;
  source_type: SupportRequest['sourceType'];
  assigned_kader_id: string | null;
  assigned_kader_name: string | null;
  assigned_counselor_id: string | null;
  assigned_counselor_name: string | null;
  counselor_follow_up_summary: string | null;
  supervision_guidance: string | null;
  created_at: string;
  updated_at: string;
}

function mapSupportRequest(row: RawRequestRow, viewerRole: Role): SupportRequest {
  // Enforce Kader data boundary: Kader never receives counselor-only summary or clinical notes
  const isKonselor = viewerRole === 'konselor';
  return {
    id: row.id,
    screeningSessionId: row.screening_session_id,
    anonymousCode: row.anonymous_code,
    displayName: row.display_name,
    ageRange: row.age_range,
    locationPost: row.location_post,
    contactAllowed: row.contact_allowed === 1,
    contactInfo: row.contact_allowed === 1 ? row.contact_info : null,
    primaryNeed: row.primary_need,
    needSummary: row.need_summary,
    activityDifficulty: row.activity_difficulty,
    socialSupportInfo: row.social_support_info,
    serviceTrack: row.service_track,
    status: row.status,
    sourceType: row.source_type,
    assignedKaderId: row.assigned_kader_id,
    assignedKaderName: row.assigned_kader_name,
    assignedCounselorId: row.assigned_counselor_id,
    assignedCounselorName: row.assigned_counselor_name,
    counselorFollowUpSummary: isKonselor ? row.counselor_follow_up_summary : null,
    supervisionGuidance: row.supervision_guidance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function canKaderAccessRequest(row: RawRequestRow, kaderId: string): boolean {
  if (row.assigned_kader_id === kaderId) return true;
  if (row.service_track === 'kader' && row.assigned_kader_id === null) return true;
  return false;
}

requestsRouter.use(requireAuth);

requestsRouter.get('/', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const user = req.user!;
  const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined;
  const trackFilter = typeof req.query.track === 'string' ? req.query.track : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

  const rows = queryAll<RawRequestRow>(
    db,
    'SELECT * FROM support_requests ORDER BY updated_at DESC',
  );

  const filtered = rows.filter((row) => {
    if (user.role === 'kader' && !canKaderAccessRequest(row, user.id)) {
      return false;
    }
    if (statusFilter && statusFilter !== 'all' && row.status !== statusFilter) {
      return false;
    }
    if (trackFilter && trackFilter !== 'all' && row.service_track !== trackFilter) {
      return false;
    }
    if (search) {
      const hay = `${row.anonymous_code} ${row.display_name} ${row.primary_need} ${row.need_summary} ${row.location_post}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  res.json({
    requests: filtered.map((r) => mapSupportRequest(r, user.role)),
  });
});

requestsRouter.get('/:id', (req: AuthenticatedRequest, res, next) => {
  try {
    const db = getDb();
    const user = req.user!;
    const row = queryOne<RawRequestRow>(
      db,
      'SELECT * FROM support_requests WHERE id = ?',
      String(req.params.id),
    );

    if (!row) {
      throw new HttpError(404, 'Data permintaan pendampingan tidak ditemukan.');
    }

    if (user.role === 'kader' && !canKaderAccessRequest(row, user.id)) {
      throw new HttpError(
        403,
        'Anda tidak memiliki kewenangan mengakses kasus di luar tanggung jawab pendampingan Anda.',
      );
    }

    // Pencatatan akses kasus sesuai prinsip perlindungan data (ESAI.docx Lampiran 9 Tabel 7)
    logAuditEvent(db, {
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'akses_detail_kasus',
      entityType: 'support_request',
      entityId: row.id,
      detail: `${user.name} (${user.role}) membuka detail kasus ${row.anonymous_code}.`,
    });

    const followUpRows = db
      .prepare(
        `SELECT id, request_id, author_id, author_name, author_role, note, action_type, is_counselor_only, created_at
         FROM follow_up_records WHERE request_id = ? ORDER BY created_at DESC`,
      )
      .all(row.id) as Array<{
      id: string;
      request_id: string;
      author_id: string;
      author_name: string;
      author_role: Role;
      note: string;
      action_type: FollowUpRecord['actionType'];
      is_counselor_only: number;
      created_at: string;
    }>;

    // Filter out counselor-only notes for kader
    const visibleFollowUps: FollowUpRecord[] = followUpRows
      .filter((fu) => user.role === 'konselor' || fu.is_counselor_only === 0)
      .map((fu) => ({
        id: fu.id,
        requestId: fu.request_id,
        authorId: fu.author_id,
        authorName: fu.author_name,
        authorRole: fu.author_role,
        note: fu.note,
        actionType: fu.action_type,
        isCounselorOnly: fu.is_counselor_only === 1,
        createdAt: fu.created_at,
      }));

    const supervisionRows = queryAll<{
      id: string;
      request_id: string;
      anonymous_code: string;
      kader_id: string;
      kader_name: string;
      supervision_type: SupervisionRequest['supervisionType'];
      reason: string;
      kader_summary: string;
      status: SupervisionRequest['status'];
      counselor_id: string | null;
      counselor_name: string | null;
      counselor_guidance: string | null;
      created_at: string;
      updated_at: string;
    }>(
      db,
      'SELECT * FROM supervision_requests WHERE request_id = ? ORDER BY created_at DESC',
      row.id,
    );

    const supervisions: SupervisionRequest[] = supervisionRows.map((s) => ({
      id: s.id,
      requestId: s.request_id,
      anonymousCode: s.anonymous_code,
      kaderId: s.kader_id,
      kaderName: s.kader_name,
      supervisionType: s.supervision_type ?? 'terjadwal',
      reason: s.reason,
      kaderSummary: s.kader_summary,
      status: s.status,
      counselorId: s.counselor_id,
      counselorName: s.counselor_name,
      counselorGuidance: s.counselor_guidance,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    const referrals: ReferralRecord[] =
      user.role === 'konselor'
        ? (
            db
              .prepare('SELECT * FROM referral_records WHERE request_id = ? ORDER BY created_at DESC')
              .all(row.id) as Array<{
              id: string;
              request_id: string;
              anonymous_code: string;
              counselor_id: string;
              counselor_name: string;
              destination_facility: string;
              referral_type: string;
              summary_note: string;
              status: ReferralRecord['status'];
              created_at: string;
              updated_at: string;
            }>
          ).map((r) => ({
            id: r.id,
            requestId: r.request_id,
            anonymousCode: r.anonymous_code,
            counselorId: r.counselor_id,
            counselorName: r.counselor_name,
            destinationFacility: r.destination_facility,
            referralType: r.referral_type,
            summaryNote: r.summary_note,
            status: r.status,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }))
        : [];

    const mapped = mapSupportRequest(row, user.role);
    mapped.followUps = visibleFollowUps;
    mapped.supervisions = supervisions;
    mapped.referrals = referrals;

    res.json({ request: mapped });
  } catch (err) {
    next(err);
  }
});

requestsRouter.patch('/:id/accept', requireRole('kader'), (req: AuthenticatedRequest, res, next) => {
  try {
    const db = getDb();
    const user = req.user!;
    const row = queryOne<RawRequestRow>(
      db,
      'SELECT * FROM support_requests WHERE id = ?',
      String(req.params.id),
    );

    if (!row) {
      throw new HttpError(404, 'Permintaan tidak ditemukan.');
    }
    if (row.service_track !== 'kader') {
      throw new HttpError(403, 'Kader hanya dapat menerima permintaan jalur pendampingan kader.');
    }
    if (row.status === 'selesai') {
      throw new HttpError(400, 'Permintaan ini sudah berstatus selesai.');
    }

    const now = new Date().toISOString();
    withTransaction(db, () => {
      db.prepare(
        `UPDATE support_requests
         SET status = 'dalam_proses', assigned_kader_id = ?, assigned_kader_name = ?, updated_at = ?
         WHERE id = ?`,
      ).run(user.id, user.name, now, row.id);

      db.prepare(
        `INSERT INTO follow_up_records (id, request_id, author_id, author_name, author_role, note, action_type, is_counselor_only, created_at)
         VALUES (?, ?, ?, ?, 'kader', ?, 'penerimaan', 0, ?)`,
      ).run(
        `fu-${crypto.randomUUID().slice(0, 8)}`,
        row.id,
        user.id,
        user.name,
        `Pendampingan diterima oleh ${user.name} dan masuk status Dalam Proses.`,
        now,
      );

      logAuditEvent(db, {
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'kader_terima_pendampingan',
        entityType: 'support_request',
        entityId: row.id,
        detail: `${user.name} menerima pendampingan untuk ${row.anonymous_code}.`,
      });
    });

    const updated = queryOne<RawRequestRow>(
      db,
      'SELECT * FROM support_requests WHERE id = ?',
      row.id,
    )!;

    res.json({ request: mapSupportRequest(updated, user.role) });
  } catch (err) {
    next(err);
  }
});

requestsRouter.post('/:id/follow-ups', (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = followUpCreateSchema.parse(req.body);
    const db = getDb();
    const user = req.user!;

    const row = queryOne<RawRequestRow>(
      db,
      'SELECT * FROM support_requests WHERE id = ?',
      String(req.params.id),
    );

    if (!row) {
      throw new HttpError(404, 'Permintaan tidak ditemukan.');
    }

    if (user.role === 'kader' && !canKaderAccessRequest(row, user.id)) {
      throw new HttpError(403, 'Anda tidak memiliki akses pada kasus ini.');
    }

    if (user.role === 'kader' && parsed.isCounselorOnly) {
      throw new HttpError(403, 'Kader tidak dapat membuat catatan rahasia konselor.');
    }

    const now = new Date().toISOString();
    const nextStatus = parsed.nextStatus ?? (row.status === 'baru' ? 'dalam_proses' : row.status);
    const followUpId = `fu-${crypto.randomUUID().slice(0, 8)}`;

    withTransaction(db, () => {
      db.prepare(
        `INSERT INTO follow_up_records (id, request_id, author_id, author_name, author_role, note, action_type, is_counselor_only, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        followUpId,
        row.id,
        user.id,
        user.name,
        user.role,
        parsed.note,
        user.role === 'konselor' ? 'tindak_lanjut_konselor' : 'catatan_kader',
        user.role === 'konselor' && parsed.isCounselorOnly ? 1 : 0,
        now,
      );

      if (user.role === 'konselor') {
        db.prepare(
          `UPDATE support_requests
           SET status = ?, assigned_counselor_id = ?, assigned_counselor_name = ?,
               counselor_follow_up_summary = ?, updated_at = ?
           WHERE id = ?`,
        ).run(nextStatus, user.id, user.name, parsed.note, now, row.id);
      } else {
        db.prepare(
          `UPDATE support_requests
           SET status = ?, assigned_kader_id = COALESCE(assigned_kader_id, ?),
               assigned_kader_name = COALESCE(assigned_kader_name, ?), updated_at = ?
           WHERE id = ?`,
        ).run(nextStatus, user.id, user.name, now, row.id);
      }

      logAuditEvent(db, {
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'catat_tindak_lanjut',
        entityType: 'support_request',
        entityId: row.id,
        detail: `${user.name} mencatat tindak lanjut untuk ${row.anonymous_code} (status: ${nextStatus}).`,
      });
    });

    const updated = queryOne<RawRequestRow>(
      db,
      'SELECT * FROM support_requests WHERE id = ?',
      row.id,
    )!;

    res.status(201).json({
      followUpId,
      request: mapSupportRequest(updated, user.role),
    });
  } catch (err) {
    next(err);
  }
});

requestsRouter.post('/:id/complete', (req: AuthenticatedRequest, res, next) => {
  try {
    const bodySchema = z.object({
      closingNote: z.string().trim().min(5, 'Catatan penyelesaian minimal 5 karakter.').max(1000),
    });
    const parsed = bodySchema.parse(req.body);
    const db = getDb();
    const user = req.user!;

    const row = queryOne<RawRequestRow>(
      db,
      'SELECT * FROM support_requests WHERE id = ?',
      String(req.params.id),
    );

    if (!row) {
      throw new HttpError(404, 'Permintaan tidak ditemukan.');
    }

    if (user.role === 'kader' && !canKaderAccessRequest(row, user.id)) {
      throw new HttpError(403, 'Anda tidak berwenang menyelesaikan kasus ini.');
    }

    const now = new Date().toISOString();
    withTransaction(db, () => {
      db.prepare(
        `UPDATE support_requests
         SET status = 'selesai', updated_at = ?
         WHERE id = ?`,
      ).run(now, row.id);

      db.prepare(
        `INSERT INTO follow_up_records (id, request_id, author_id, author_name, author_role, note, action_type, is_counselor_only, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'selesai', 0, ?)`,
      ).run(
        `fu-${crypto.randomUUID().slice(0, 8)}`,
        row.id,
        user.id,
        user.name,
        user.role,
        parsed.closingNote,
        now,
      );

      logAuditEvent(db, {
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'pendampingan_selesai',
        entityType: 'support_request',
        entityId: row.id,
        detail: `${user.name} menandai selesai layanan untuk ${row.anonymous_code}.`,
      });
    });

    const updated = queryOne<RawRequestRow>(
      db,
      'SELECT * FROM support_requests WHERE id = ?',
      row.id,
    )!;

    res.json({ request: mapSupportRequest(updated, user.role) });
  } catch (err) {
    next(err);
  }
});
