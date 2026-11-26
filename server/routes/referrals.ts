import crypto from 'node:crypto';
import { Router } from 'express';
import type { ReferralRecord } from '../../shared/types.js';
import { referralCreateSchema, referralUpdateSchema } from '../../shared/validation.js';
import { getDb, queryAll, queryOne, withTransaction } from '../db/database.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { logAuditEvent } from '../services/audit.js';

export const referralsRouter = Router();

interface RawReferralRow {
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
}

function mapReferral(row: RawReferralRow): ReferralRecord {
  return {
    id: row.id,
    requestId: row.request_id,
    anonymousCode: row.anonymous_code,
    counselorId: row.counselor_id,
    counselorName: row.counselor_name,
    destinationFacility: row.destination_facility,
    referralType: row.referral_type,
    summaryNote: row.summary_note,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

referralsRouter.use(requireAuth, requireRole('konselor'));

referralsRouter.get('/', (_req, res) => {
  const db = getDb();
  const rows = queryAll<RawReferralRow>(
    db,
    'SELECT * FROM referral_records ORDER BY updated_at DESC',
  );

  res.json({ referrals: rows.map(mapReferral) });
});

referralsRouter.post('/', (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = referralCreateSchema.parse(req.body);
    const db = getDb();
    const user = req.user!;

    const reqRow = db
      .prepare('SELECT id, anonymous_code FROM support_requests WHERE id = ?')
      .get(parsed.requestId) as { id: string; anonymous_code: string } | undefined;

    if (!reqRow) {
      throw new HttpError(404, 'Data permintaan layanan tidak ditemukan.');
    }

    const now = new Date().toISOString();
    const refId = `ref-${crypto.randomUUID().slice(0, 8)}`;

    withTransaction(db, () => {
      db.prepare(
        `INSERT INTO referral_records (
          id, request_id, anonymous_code, counselor_id, counselor_name,
          destination_facility, referral_type, summary_note, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        refId,
        reqRow.id,
        reqRow.anonymous_code,
        user.id,
        user.name,
        parsed.destinationFacility,
        parsed.referralType,
        parsed.summaryNote,
        parsed.status,
        now,
        now,
      );

      const newReqStatus = parsed.status === 'selesai' ? 'selesai' : 'menunggu_rujukan';
      db.prepare(
        `UPDATE support_requests
         SET status = ?, assigned_counselor_id = ?, assigned_counselor_name = ?, updated_at = ?
         WHERE id = ?`,
      ).run(newReqStatus, user.id, user.name, now, reqRow.id);

      db.prepare(
        `INSERT INTO follow_up_records (id, request_id, author_id, author_name, author_role, note, action_type, is_counselor_only, created_at)
         VALUES (?, ?, ?, ?, 'konselor', ?, 'rujukan', 1, ?)`,
      ).run(
        `fu-${crypto.randomUUID().slice(0, 8)}`,
        reqRow.id,
        user.id,
        user.name,
        `Rujukan (${parsed.status}) ke ${parsed.destinationFacility}: ${parsed.summaryNote}`,
        now,
      );

      logAuditEvent(db, {
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'rujukan_dibuat',
        entityType: 'referral_record',
        entityId: refId,
        detail: `Rujukan ke ${parsed.destinationFacility} (${parsed.status}) untuk ${reqRow.anonymous_code}.`,
      });
    });

    const created = queryOne<RawReferralRow>(
      db,
      'SELECT * FROM referral_records WHERE id = ?',
      refId,
    )!;

    res.status(201).json({ referral: mapReferral(created) });
  } catch (err) {
    next(err);
  }
});

referralsRouter.patch('/:id', (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = referralUpdateSchema.parse(req.body);
    const db = getDb();
    const user = req.user!;

    const existing = queryOne<RawReferralRow>(
      db,
      'SELECT * FROM referral_records WHERE id = ?',
      String(req.params.id),
    );

    if (!existing) {
      throw new HttpError(404, 'Catatan rujukan tidak ditemukan.');
    }

    const now = new Date().toISOString();
    withTransaction(db, () => {
      db.prepare(
        `UPDATE referral_records
         SET status = ?,
             summary_note = COALESCE(?, summary_note),
             destination_facility = COALESCE(?, destination_facility),
             updated_at = ?
         WHERE id = ?`,
      ).run(
        parsed.status,
        parsed.summaryNote ?? null,
        parsed.destinationFacility ?? null,
        now,
        existing.id,
      );

      db.prepare(
        `UPDATE support_requests
         SET status = ?, updated_at = ?
         WHERE id = ?`,
      ).run(parsed.status === 'selesai' ? 'selesai' : 'menunggu_rujukan', now, existing.request_id);

      logAuditEvent(db, {
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'rujukan_diperbarui',
        entityType: 'referral_record',
        entityId: existing.id,
        detail: `Status rujukan ${existing.anonymous_code} diperbarui menjadi ${parsed.status}.`,
      });
    });

    const updated = queryOne<RawReferralRow>(
      db,
      'SELECT * FROM referral_records WHERE id = ?',
      existing.id,
    )!;

    res.json({ referral: mapReferral(updated) });
  } catch (err) {
    next(err);
  }
});
