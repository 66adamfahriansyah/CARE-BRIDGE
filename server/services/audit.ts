import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export function logAuditEvent(
  db: DatabaseSync,
  params: {
    actorId?: string | null;
    actorName: string;
    actorRole: string;
    action: string;
    entityType: string;
    entityId: string;
    detail: string;
  },
): void {
  const id = `aud-${crypto.randomUUID().slice(0, 8)}`;
  db.prepare(
    `
    INSERT INTO audit_events (id, actor_id, actor_name, actor_role, action, entity_type, entity_id, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    params.actorId ?? null,
    params.actorName,
    params.actorRole,
    params.action,
    params.entityType,
    params.entityId,
    params.detail,
    new Date().toISOString(),
  );
}
