import type { NextFunction, Request, Response } from 'express';
import type { Role, User } from '../../shared/types.js';
import { getDb } from '../db/database.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionToken?: string;
}

export const SESSION_COOKIE_NAME = 'cb_session';

export function resolveSessionUser(req: Request): { user?: User; token?: string } {
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  const token = cookieToken || bearerToken;

  if (!token) {
    return {};
  }

  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT u.id, u.username, u.name, u.role, u.title, u.location_post, s.expires_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ?
    `,
    )
    .get(token) as
    | {
        id: string;
        username: string;
        name: string;
        role: Role;
        title: string;
        location_post: string;
        expires_at: string;
      }
    | undefined;

  if (!row) {
    return {};
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return {};
  }

  return {
    token,
    user: {
      id: row.id,
      username: row.username,
      name: row.name,
      role: row.role,
      title: row.title,
      locationPost: row.location_post,
    },
  };
}

export function attachOptionalUser(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const { user, token } = resolveSessionUser(req);
  req.user = user;
  req.sessionToken = token;
  next();
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const { user, token } = resolveSessionUser(req);
  if (!user) {
    res.status(401).json({
      error: 'Sesi tidak ditemukan atau telah berakhir. Silakan masuk terlebih dahulu.',
    });
    return;
  }
  req.user = user;
  req.sessionToken = token;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Autentikasi diperlukan untuk mengakses modul ini.',
      });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Akses ditolak. Modul ini hanya tersedia untuk peran ${roles.join(' atau ')}.`,
      });
      return;
    }
    next();
  };
}
