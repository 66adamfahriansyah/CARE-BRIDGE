import crypto from 'node:crypto';
import { Router } from 'express';
import type { EducationArticle, KnowledgeDocument } from '../../shared/types.js';
import { educationArticleSchema } from '../../shared/validation.js';
import { getDb, queryAll, queryOne } from '../db/database.js';
import {
  attachOptionalUser,
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { logAuditEvent } from '../services/audit.js';

export const educationRouter = Router();

interface RawArticleRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  reference_source: string;
  status: EducationArticle['status'];
  author_name: string;
  read_time_minutes: number;
  created_at: string;
  updated_at: string;
}

function mapArticle(row: RawArticleRow): EducationArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    category: row.category,
    referenceSource: row.reference_source,
    status: row.status,
    authorName: row.author_name,
    readTimeMinutes: row.read_time_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 72);
}

educationRouter.get('/articles', attachOptionalUser, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const includeDrafts = req.query.includeDrafts === 'true' && req.user?.role === 'konselor';
  const category = typeof req.query.category === 'string' ? req.query.category : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

  const rows = queryAll<RawArticleRow>(
    db,
    'SELECT * FROM education_articles ORDER BY updated_at DESC',
  );

  const filtered = rows.filter((r) => {
    if (!includeDrafts && r.status !== 'published') return false;
    if (category && category !== 'all' && r.category !== category) return false;
    if (search) {
      const hay = `${r.title} ${r.summary} ${r.category} ${r.content}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  res.json({ articles: filtered.map(mapArticle) });
});

educationRouter.get('/articles/:slug', attachOptionalUser, (req: AuthenticatedRequest, res, next) => {
  try {
    const db = getDb();
    const slugParam = String(req.params.slug);
    const row = queryOne<RawArticleRow>(
      db,
      'SELECT * FROM education_articles WHERE slug = ? OR id = ?',
      slugParam,
      slugParam,
    );

    if (!row) {
      throw new HttpError(404, 'Materi edukasi tidak ditemukan.');
    }

    if (row.status !== 'published' && req.user?.role !== 'konselor') {
      throw new HttpError(404, 'Materi edukasi belum dipublikasikan.');
    }

    const relatedRows = queryAll<RawArticleRow>(
      db,
      `SELECT * FROM education_articles
       WHERE status = 'published' AND id != ?
       ORDER BY CASE WHEN category = ? THEN 0 ELSE 1 END, updated_at DESC
       LIMIT 3`,
      row.id,
      row.category,
    );

    res.json({
      article: mapArticle(row),
      related: relatedRows.map(mapArticle),
    });
  } catch (err) {
    next(err);
  }
});

educationRouter.post(
  '/articles',
  requireAuth,
  requireRole('konselor'),
  (req: AuthenticatedRequest, res, next) => {
    try {
      const parsed = educationArticleSchema.parse(req.body);
      const db = getDb();
      const user = req.user!;
      const now = new Date().toISOString();
      const id = `art-${crypto.randomUUID().slice(0, 8)}`;

      let baseSlug = slugify(parsed.title) || id;
      const existingSlug = db
        .prepare('SELECT id FROM education_articles WHERE slug = ?')
        .get(baseSlug);
      if (existingSlug) {
        baseSlug = `${baseSlug}-${id.slice(-4)}`;
      }

      db.prepare(
        `INSERT INTO education_articles (
          id, slug, title, summary, content, category, reference_source,
          status, author_name, read_time_minutes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        baseSlug,
        parsed.title,
        parsed.summary,
        parsed.content,
        parsed.category,
        parsed.referenceSource,
        parsed.status,
        user.name,
        parsed.readTimeMinutes,
        now,
        now,
      );

      logAuditEvent(db, {
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: parsed.status === 'published' ? 'materi_dipublikasikan' : 'materi_draf_dibuat',
        entityType: 'education_article',
        entityId: id,
        detail: `${user.name} membuat materi "${parsed.title}" (${parsed.status}).`,
      });

      const created = queryOne<RawArticleRow>(
        db,
        'SELECT * FROM education_articles WHERE id = ?',
        id,
      )!;

      res.status(201).json({ article: mapArticle(created) });
    } catch (err) {
      next(err);
    }
  },
);

educationRouter.put(
  '/articles/:id',
  requireAuth,
  requireRole('konselor'),
  (req: AuthenticatedRequest, res, next) => {
    try {
      const parsed = educationArticleSchema.parse(req.body);
      const db = getDb();
      const user = req.user!;

      const articleId = String(req.params.id);
      const existing = queryOne<RawArticleRow>(
        db,
        'SELECT * FROM education_articles WHERE id = ?',
        articleId,
      );

      if (!existing) {
        throw new HttpError(404, 'Materi edukasi tidak ditemukan.');
      }

      const now = new Date().toISOString();
      db.prepare(
        `UPDATE education_articles
         SET title = ?, summary = ?, content = ?, category = ?, reference_source = ?,
             status = ?, read_time_minutes = ?, updated_at = ?
         WHERE id = ?`,
      ).run(
        parsed.title,
        parsed.summary,
        parsed.content,
        parsed.category,
        parsed.referenceSource,
        parsed.status,
        parsed.readTimeMinutes,
        now,
        existing.id,
      );

      logAuditEvent(db, {
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'materi_diperbarui',
        entityType: 'education_article',
        entityId: existing.id,
        detail: `${user.name} memperbarui materi "${parsed.title}" (${parsed.status}).`,
      });

      const updated = queryOne<RawArticleRow>(
        db,
        'SELECT * FROM education_articles WHERE id = ?',
        existing.id,
      )!;

      res.json({ article: mapArticle(updated) });
    } catch (err) {
      next(err);
    }
  },
);

educationRouter.delete(
  '/articles/:id',
  requireAuth,
  requireRole('konselor'),
  (req: AuthenticatedRequest, res, next) => {
    try {
      const db = getDb();
      const user = req.user!;
      const existing = queryOne<{ id: string; title: string }>(
        db,
        'SELECT id, title FROM education_articles WHERE id = ?',
        String(req.params.id),
      );

      if (!existing) {
        throw new HttpError(404, 'Materi edukasi tidak ditemukan.');
      }

      db.prepare('DELETE FROM education_articles WHERE id = ?').run(existing.id);

      logAuditEvent(db, {
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'materi_dihapus',
        entityType: 'education_article',
        entityId: existing.id,
        detail: `${user.name} menghapus materi "${existing.title}".`,
      });

      res.json({ ok: true, id: existing.id });
    } catch (err) {
      next(err);
    }
  },
);

educationRouter.get('/knowledge', (_req, res) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, title, content, category, reference_source, updated_at FROM knowledge_documents')
    .all() as Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    reference_source: string;
    updated_at: string;
  }>;

  const docs: KnowledgeDocument[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    category: r.category,
    referenceSource: r.reference_source,
    updatedAt: r.updated_at,
  }));

  res.json({ documents: docs });
});
