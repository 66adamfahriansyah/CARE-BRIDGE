import { Router } from 'express';
import { getDb } from '../db/database.js';
import { resetDemoData } from '../db/seed.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../services/audit.js';

export const demoRouter = Router();

demoRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'CARE BRIDGE Prototype API',
    timestamp: new Date().toISOString(),
  });
});

demoRouter.post('/demo/reset', requireAuth, requireRole('kader', 'konselor'), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const actor = req.user!;
  resetDemoData(db);
  logAuditEvent(db, {
    actorId: null,
    actorName: `${actor.name} (Reset Demo)`,
    actorRole: actor.role,
    action: 'demo_reset',
    entityType: 'system',
    entityId: 'demo-seed',
    detail: 'Seluruh data demonstrasi dikembalikan ke kondisi awal oleh pengguna demo.',
  });
  res.json({
    ok: true,
    message: 'Data demonstrasi berhasil dikembalikan ke kondisi awal.',
  });
});
