import { Router } from 'express';
import { getDb } from '../db/database.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { getKaderStats, getKonselorStats } from '../services/statsService.js';

export const statsRouter = Router();

statsRouter.use(requireAuth);

statsRouter.get('/kader', requireRole('kader', 'konselor'), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const kaderId = req.user?.role === 'kader' ? req.user.id : undefined;
  res.json(getKaderStats(db, kaderId));
});

statsRouter.get('/konselor', requireRole('konselor'), (req, res) => {
  const db = getDb();
  const months = Number(req.query.months) === 12 ? 12 : 6;
  const category = typeof req.query.category === 'string' ? req.query.category : 'all';
  res.json(getKonselorStats(db, months, category));
});

statsRouter.get('/audit', requireRole('konselor'), (_req, res) => {
  const db = getDb();
  const events = db
    .prepare(
      `SELECT id, actor_id, actor_name, actor_role, action, entity_type, entity_id, detail, created_at
       FROM audit_events ORDER BY created_at DESC LIMIT 30`,
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

  res.json({
    events: events.map((e) => ({
      id: e.id,
      actorId: e.actor_id,
      actorName: e.actor_name,
      actorRole: e.actor_role,
      action: e.action,
      entityType: e.entity_type,
      entityId: e.entity_id,
      detail: e.detail,
      createdAt: e.created_at,
    })),
  });
});
