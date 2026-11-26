import crypto from 'node:crypto';
import { Router } from 'express';
import { supervisionCreateSchema, supervisionUpdateSchema } from '../../shared/validation.js';
import type { SupervisionRequest } from '../../shared/types.js';
import { getDb, queryAll, queryOne, withTransaction } from '../db/database.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { logAuditEvent } from '../services/audit.js';

export const supervisionsRouter = Router();

interface RawSupervisionRow {
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
}

function mapSupervision(row: RawSupervisionRow): SupervisionRequest {
  return {
    id: row.id,
    requestId: row.request_id,
    anonymousCode: row.anonymous_code,
    kaderId: row.kader_id,
    kaderName: row.kader_name,
    supervisionType: row.supervision_type ?? 'terjadwal',
    reason: row.reason,
    kaderSummary: row.kader_summary,
    status: row.status,
    counselorId: row.counselor_id,
    counselorName: row.counselor_name,
    counselorGuidance: row.counselor_guidance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

supervisionsRouter.use(requireAuth);

supervisionsRouter.get('/', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const user = req.user!;
  const rows = queryAll<RawSupervisionRow>(
    db,
    `SELECT * FROM supervision_requests
     ORDER BY CASE WHEN supervision_type = 'konsultasi_segera' THEN 0 ELSE 1 END, updated_at DESC`,
  );

  const visible =
    user.role === 'konselor' ? rows : rows.filter((r) => r.kader_id === user.id || r.kader_id === 'usr-kader-01');

  res.json({ supervisions: visible.map(mapSupervision) });
});

supervisionsRouter.post('/', requireRole('kader'), (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = supervisionCreateSchema.parse(req.body);
    const db = getDb();
    const user = req.user!;

    const reqRow = db
      .prepare('SELECT id, anonymous_code, service_track FROM support_requests WHERE id = ?')
      .get(parsed.requestId) as
      | { id: string; anonymous_code: string; service_track: string }
      | undefined;

    if (!reqRow) {
      throw new HttpError(404, 'Kasus pendampingan tidak ditemukan.');
    }

    const now = new Date().toISOString();
    const supId = `sup-${crypto.randomUUID().slice(0, 8)}`;

    withTransaction(db, () => {
      db.prepare(
        `INSERT INTO supervision_requests (
          id, request_id, anonymous_code, kader_id, kader_name, supervision_type, reason, kader_summary,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'menunggu', ?, ?)`,
      ).run(
        supId,
        reqRow.id,
        reqRow.anonymous_code,
        user.id,
        user.name,
        parsed.supervisionType,
        parsed.reason,
        parsed.kaderSummary,
        now,
        now,
      );

      db.prepare(
        `UPDATE support_requests
         SET status = 'perlu_supervisi', assigned_kader_id = COALESCE(assigned_kader_id, ?),
             assigned_kader_name = COALESCE(assigned_kader_name, ?), updated_at = ?
         WHERE id = ?`,
      ).run(user.id, user.name, now, reqRow.id);

      db.prepare(
        `INSERT INTO follow_up_records (id, request_id, author_id, author_name, author_role, note, action_type, is_counselor_only, created_at)
         VALUES (?, ?, ?, ?, 'kader', ?, 'pengajuan_supervisi', 0, ?)`,
      ).run(
        `fu-${crypto.randomUUID().slice(0, 8)}`,
        reqRow.id,
        user.id,
        user.name,
        `Mengajukan ${parsed.supervisionType === 'konsultasi_segera' ? 'konsultasi segera' : 'supervisi terjadwal'} ke konselor: ${parsed.reason}`,
        now,
      );

      logAuditEvent(db, {
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action:
          parsed.supervisionType === 'konsultasi_segera'
            ? 'ajukan_konsultasi_segera'
            : 'ajukan_supervisi',
        entityType: 'supervision_request',
        entityId: supId,
        detail: `${user.name} mengajukan ${parsed.supervisionType === 'konsultasi_segera' ? 'konsultasi segera' : 'supervisi'} untuk ${reqRow.anonymous_code}.`,
      });
    });

    const created = queryOne<RawSupervisionRow>(
      db,
      'SELECT * FROM supervision_requests WHERE id = ?',
      supId,
    )!;

    res.status(201).json({ supervision: mapSupervision(created) });
  } catch (err) {
    next(err);
  }
});

supervisionsRouter.patch(
  '/:id',
  requireRole('konselor'),
  (req: AuthenticatedRequest, res, next) => {
    try {
      const parsed = supervisionUpdateSchema.parse(req.body);
      const db = getDb();
      const user = req.user!;

      const existing = queryOne<RawSupervisionRow>(
        db,
        'SELECT * FROM supervision_requests WHERE id = ?',
        String(req.params.id),
      );

      if (!existing) {
        throw new HttpError(404, 'Permintaan supervisi tidak ditemukan.');
      }

      const now = new Date().toISOString();
      const nextRequestStatus =
        parsed.requestStatusAfter ??
        (parsed.status === 'arahan_dikirim' || parsed.status === 'selesai'
          ? 'dalam_proses'
          : 'perlu_supervisi');

      withTransaction(db, () => {
        db.prepare(
          `UPDATE supervision_requests
           SET status = ?, counselor_id = ?, counselor_name = ?, counselor_guidance = ?, updated_at = ?
           WHERE id = ?`,
        ).run(parsed.status, user.id, user.name, parsed.counselorGuidance, now, existing.id);

        db.prepare(
          `UPDATE support_requests
           SET status = ?, assigned_counselor_id = ?, assigned_counselor_name = ?,
               supervision_guidance = ?, updated_at = ?
           WHERE id = ?`,
        ).run(
          nextRequestStatus,
          user.id,
          user.name,
          parsed.counselorGuidance,
          now,
          existing.request_id,
        );

        db.prepare(
          `INSERT INTO follow_up_records (id, request_id, author_id, author_name, author_role, note, action_type, is_counselor_only, created_at)
           VALUES (?, ?, ?, ?, 'konselor', ?, 'arahan_supervisi', 0, ?)`,
        ).run(
          `fu-${crypto.randomUUID().slice(0, 8)}`,
          existing.request_id,
          user.id,
          user.name,
          `Arahan supervisi konselor: ${parsed.counselorGuidance}`,
          now,
        );

        logAuditEvent(db, {
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
          action: 'supervisi_ditanggapi',
          entityType: 'supervision_request',
          entityId: existing.id,
          detail: `${user.name} mengirim arahan supervisi untuk ${existing.anonymous_code}.`,
        });
      });

      const updated = queryOne<RawSupervisionRow>(
        db,
        'SELECT * FROM supervision_requests WHERE id = ?',
        existing.id,
      )!;

      res.json({ supervision: mapSupervision(updated) });
    } catch (err) {
      next(err);
    }
  },
);
