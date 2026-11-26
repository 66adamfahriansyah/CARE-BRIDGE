import crypto from 'node:crypto';
import { Router } from 'express';
import { loginSchema } from '../../shared/validation.js';
import { getDb } from '../db/database.js';
import { hashPassword } from '../db/seed.js';
import {
  attachOptionalUser,
  SESSION_COOKIE_NAME,
  type AuthenticatedRequest,
} from '../middleware/auth.js';
import { logAuditEvent } from '../services/audit.js';
import type { Role } from '../../shared/types.js';

export const authRouter = Router();

authRouter.post('/login', (req, res, next) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const db = getDb();

    const userRow = db
      .prepare(
        `SELECT id, username, password_hash, name, role, title, location_post
         FROM users WHERE username = ?`,
      )
      .get(parsed.username) as
      | {
          id: string;
          username: string;
          password_hash: string;
          name: string;
          role: Role;
          title: string;
          location_post: string;
        }
      | undefined;

    if (!userRow || userRow.password_hash !== hashPassword(parsed.password)) {
      res.status(401).json({
        error: 'Username atau kata sandi demonstrasi tidak sesuai.',
      });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 3600_000).toISOString();

    db.prepare('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
      token,
      userRow.id,
      expiresAt,
      now.toISOString(),
    );

    logAuditEvent(db, {
      actorId: userRow.id,
      actorName: userRow.name,
      actorRole: userRow.role,
      action: 'demo_login',
      entityType: 'session',
      entityId: userRow.id,
      detail: `${userRow.name} (${userRow.role}) masuk ke sesi demonstrasi.`,
    });

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 3600_000,
    });

    res.json({
      token,
      user: {
        id: userRow.id,
        username: userRow.username,
        name: userRow.name,
        role: userRow.role,
        title: userRow.title,
        locationPost: userRow.location_post,
      },
      prototypeNotice:
        'Autentikasi demonstrasi aktif untuk simulasi peran. Bukan autentikasi produksi.',
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', attachOptionalUser, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (req.sessionToken) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.sessionToken);
  }
  if (req.user) {
    logAuditEvent(db, {
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'demo_logout',
      entityType: 'session',
      entityId: req.user.id,
      detail: `${req.user.name} keluar dari sesi demonstrasi.`,
    });
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

authRouter.get('/me', attachOptionalUser, (req: AuthenticatedRequest, res) => {
  res.json({
    user: req.user ?? null,
    isAuthenticated: Boolean(req.user),
  });
});
