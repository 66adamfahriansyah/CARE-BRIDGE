import crypto from 'node:crypto';
import { Router } from 'express';
import { evaluateScreeningDecision } from '../../shared/decisionEngine.js';
import {
  fullScreeningSubmitSchema,
  quickHelpRequestSchema,
} from '../../shared/validation.js';
import { getDb, withTransaction } from '../db/database.js';
import { logAuditEvent } from '../services/audit.js';

export const screeningRouter = Router();

function generateAnonymousCode(): string {
  const num = 1050 + Math.floor(Math.random() * 8900);
  return `Pengguna #${num}`;
}

function difficultyLabel(diff: string): string {
  switch (diff) {
    case 'tidak':
      return 'Tidak merasa terganggu dalam aktivitas harian';
    case 'sedikit':
      return 'Sedikit terganggu';
    case 'cukup_terganggu':
      return 'Cukup terganggu dalam beraktivitas';
    case 'sangat_terganggu':
      return 'Sangat terganggu dalam beraktivitas';
    default:
      return diff;
  }
}

function supportLabel(support: string, needed: string[]): string {
  const base =
    support === 'ya'
      ? 'Memiliki keluarga/teman tepercaya'
      : support === 'terbatas'
        ? 'Dukungan sekitar terbatas'
        : 'Belum memiliki pendamping terdekat saat ini';
  return needed.length > 0 ? `${base} • Kebutuhan: ${needed.join(', ')}` : base;
}

screeningRouter.post('/screenings', (req, res, next) => {
  try {
    const input = fullScreeningSubmitSchema.parse(req.body);
    const decision = evaluateScreeningDecision(input);
    const db = getDb();
    const now = new Date().toISOString();

    const consentId = `cns-${crypto.randomUUID().slice(0, 8)}`;
    const sessionId = `scr-${crypto.randomUUID().slice(0, 8)}`;
    const anonymousCode = generateAnonymousCode();
    const displayName = input.isAnonymous
      ? `Anonim (${anonymousCode.replace('Pengguna ', '')})`
      : input.nickname.trim();

    let createdRequest: {
      id: string;
      anonymousCode: string;
      status: string;
      serviceTrack: string;
    } | null = null;

    withTransaction(db, () => {
      db.prepare(
        `INSERT INTO consent_records (
          id, session_id, understood_confidentiality, agreed_to_proceed,
          agreed_follow_up_contact, consent_timestamp
        ) VALUES (?, ?, 1, 1, ?, ?)`,
      ).run(consentId, sessionId, input.agreedFollowUpContact ? 1 : 0, now);

      db.prepare(
        `INSERT INTO screening_sessions (
          id, consent_id, anonymous_code, age_range, location_post,
          safety_status, emotional_state, sleep_difficulty, primary_need,
          activity_difficulty, has_trusted_support, practical_needs_json,
          social_support_needed_json, service_choice, recommended_track, matched_rules_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        sessionId,
        consentId,
        anonymousCode,
        input.ageRange,
        input.locationPost,
        input.safetyStatus,
        input.emotionalState,
        input.sleepDifficulty,
        input.primaryNeed,
        input.activityDifficulty,
        input.hasTrustedSupport,
        JSON.stringify(input.practicalNeeds),
        JSON.stringify(input.socialSupportNeeded),
        input.companionPreference,
        decision.track,
        JSON.stringify(decision.matchedRules),
        now,
      );

      if (decision.shouldCreateRequest && decision.initialStatus) {
        const requestId = `req-${crypto.randomUUID().slice(0, 8)}`;
        const practicalFiltered = input.practicalNeeds.filter(
          (p) => !p.toLowerCase().includes('tidak ada kebutuhan'),
        );
        const summaryParts = [
          input.primaryNeed,
          practicalFiltered.length > 0 ? `Kebutuhan praktis: ${practicalFiltered.join(', ')}` : '',
          `Aturan: ${decision.ruleCode}`,
          input.additionalNotes ? `Catatan: ${input.additionalNotes}` : '',
        ].filter(Boolean);

        db.prepare(
          `INSERT INTO support_requests (
            id, screening_session_id, anonymous_code, display_name, age_range,
            location_post, contact_allowed, contact_info, primary_need, need_summary,
            activity_difficulty, social_support_info, service_track, status, source_type,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'skrining', ?, ?)`,
        ).run(
          requestId,
          sessionId,
          anonymousCode,
          displayName,
          input.ageRange,
          input.locationPost,
          input.agreedFollowUpContact ? 1 : 0,
          input.agreedFollowUpContact ? input.contactInfo.trim() : null,
          input.primaryNeed,
          summaryParts.join(' — '),
          difficultyLabel(input.activityDifficulty),
          supportLabel(input.hasTrustedSupport, input.socialSupportNeeded),
          decision.track,
          decision.initialStatus,
          now,
          now,
        );

        createdRequest = {
          id: requestId,
          anonymousCode,
          status: decision.initialStatus,
          serviceTrack: decision.track,
        };

        logAuditEvent(db, {
          actorName: `Penyintas (${anonymousCode})`,
          actorRole: 'publik',
          action:
            decision.track === 'konselor'
              ? 'permintaan_konseling_baru'
              : decision.track === 'bantuan_segera'
                ? 'permintaan_bantuan_segera'
                : 'permintaan_pendampingan_baru',
          entityType: 'support_request',
          entityId: requestId,
          detail: `${anonymousCode} mengirim permintaan (${decision.track}) dari ${input.locationPost}.`,
        });
      }
    });

    res.status(201).json({
      sessionId,
      consentId,
      anonymousCode,
      decision,
      createdRequest,
      submittedAt: now,
    });
  } catch (err) {
    next(err);
  }
});

screeningRouter.post('/requests/quick', (req, res, next) => {
  try {
    const input = quickHelpRequestSchema.parse(req.body);
    const db = getDb();
    const now = new Date().toISOString();
    const requestId = `req-${crypto.randomUUID().slice(0, 8)}`;
    const anonymousCode = generateAnonymousCode();
    const displayName =
      input.isAnonymous || !input.nickname?.trim()
        ? `Anonim (${anonymousCode.replace('Pengguna ', '')})`
        : input.nickname.trim();

    withTransaction(db, () => {
      db.prepare(
        `INSERT INTO support_requests (
          id, screening_session_id, anonymous_code, display_name, age_range,
          location_post, contact_allowed, contact_info, primary_need, need_summary,
          activity_difficulty, social_support_info, service_track, status, source_type,
          created_at, updated_at
        ) VALUES (?, NULL, ?, ?, 'Tidak disebutkan', ?, ?, ?, ?, ?, 'Permintaan langsung tanpa skrining', 'Menunggu kontak awal petugas', ?, 'baru', 'permintaan_cepat', ?, ?)`,
      ).run(
        requestId,
        anonymousCode,
        displayName,
        input.locationPost,
        input.agreedFollowUpContact ? 1 : 0,
        input.agreedFollowUpContact ? input.contactInfo?.trim() || null : null,
        input.primaryNeed,
        `Permintaan cepat tanpa skrining: ${input.primaryNeed}`,
        input.preferredTrack,
        now,
        now,
      );

      logAuditEvent(db, {
        actorName: `Penyintas (${anonymousCode})`,
        actorRole: 'publik',
        action: 'permintaan_cepat_tanpa_skrining',
        entityType: 'support_request',
        entityId: requestId,
        detail: `${anonymousCode} mengajukan permintaan pendampingan langsung (${input.preferredTrack}) dari ${input.locationPost}.`,
      });
    });

    res.status(201).json({
      request: {
        id: requestId,
        anonymousCode,
        status: 'baru',
        serviceTrack: input.preferredTrack,
        locationPost: input.locationPost,
        createdAt: now,
      },
    });
  } catch (err) {
    next(err);
  }
});
