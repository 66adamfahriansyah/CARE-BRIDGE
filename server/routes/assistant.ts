import crypto from 'node:crypto';
import { Router } from 'express';
import { assistantReportSchema, chatMessageSchema } from '../../shared/validation.js';
import { getDb } from '../db/database.js';
import { logAuditEvent } from '../services/audit.js';
import { generateCareAssistantReply } from '../services/careAssistant.js';

export const assistantRouter = Router();

assistantRouter.get('/suggestions', (_req, res) => {
  res.json({
    suggestions: [
      'Bagaimana cara mengatasi rasa cemas setelah bencana?',
      'Tips mengelola stres dengan teknik pernapasan',
      'Bagaimana cara mendukung keluarga dan anak di posko?',
      'Bagaimana cara mengakses layanan dan peran kader?',
    ],
    disclaimer: 'Demo — jawaban berbasis pengetahuan lokal, bukan layanan AI klinis',
  });
});

assistantRouter.post('/chat', (req, res, next) => {
  try {
    const parsed = chatMessageSchema.parse(req.body);
    const db = getDb();
    const now = new Date().toISOString();

    const existingSession = db
      .prepare('SELECT id FROM chat_sessions WHERE id = ?')
      .get(parsed.sessionId);

    if (!existingSession) {
      db.prepare('INSERT INTO chat_sessions (id, created_at) VALUES (?, ?)').run(
        parsed.sessionId,
        now,
      );
    }

    const history = db
      .prepare(
        `SELECT sender, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 12`,
      )
      .all(parsed.sessionId) as Array<{ sender: string; content: string }>;

    const userMsgId = `msg-${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(
      `INSERT INTO chat_messages (id, session_id, sender, content, sources_json, is_emergency_flag, created_at)
       VALUES (?, ?, 'user', ?, NULL, 0, ?)`,
    ).run(userMsgId, parsed.sessionId, parsed.message, now);

    const reply = generateCareAssistantReply(db, parsed.message, history);
    const assistantTime = new Date(Date.now() + 10).toISOString();
    const assistantMsgId = `msg-${crypto.randomUUID().slice(0, 8)}`;

    db.prepare(
      `INSERT INTO chat_messages (id, session_id, sender, content, sources_json, is_emergency_flag, created_at)
       VALUES (?, ?, 'assistant', ?, ?, ?, ?)`,
    ).run(
      assistantMsgId,
      parsed.sessionId,
      reply.content,
      JSON.stringify(reply.sources),
      reply.isEmergencyFlag ? 1 : 0,
      assistantTime,
    );

    res.json({
      userMessage: {
        id: userMsgId,
        sessionId: parsed.sessionId,
        sender: 'user',
        content: parsed.message,
        createdAt: now,
      },
      assistantMessage: {
        id: assistantMsgId,
        sessionId: parsed.sessionId,
        sender: 'assistant',
        content: reply.content,
        sources: reply.sources,
        isEmergencyFlag: reply.isEmergencyFlag,
        createdAt: assistantTime,
      },
      disclaimer: 'Demo — jawaban berbasis pengetahuan lokal, bukan layanan AI klinis',
    });
  } catch (err) {
    next(err);
  }
});

assistantRouter.post('/report', (req, res, next) => {
  try {
    const parsed = assistantReportSchema.parse(req.body);
    const db = getDb();
    logAuditEvent(db, {
      actorName: 'Pengguna CARE Assistant',
      actorRole: 'publik',
      action: 'ai_error_report',
      entityType: 'chat_message',
      entityId: parsed.messageId,
      detail: `Laporan ketidaksesuaian jawaban asisten (${parsed.sessionId}): ${parsed.reason}`,
    });
    res.status(201).json({
      ok: true,
      message: 'Laporan ketidaksesuaian berhasil dicatat untuk ditinjau konselor.',
    });
  } catch (err) {
    next(err);
  }
});
