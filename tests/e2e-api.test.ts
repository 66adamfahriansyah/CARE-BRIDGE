import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { PassThrough } from 'node:stream';
import type { Express } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../server/index.js';
import { closeDb } from '../server/db/database.js';

let app: Express;

async function apiFetch(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
) {
  const method = options.method ?? 'GET';
  const payload =
    options.body !== undefined ? Buffer.from(JSON.stringify(options.body), 'utf8') : null;

  const reqStream = new PassThrough() as unknown as Socket;
  const req = new IncomingMessage(reqStream);
  req.method = method;
  req.url = path;
  req.headers = {
    host: 'localhost',
  };
  if (payload) {
    req.headers['content-type'] = 'application/json';
    req.headers['content-length'] = String(payload.byteLength);
  }
  if (options.token) {
    req.headers['authorization'] = `Bearer ${options.token}`;
  }

  const res = new ServerResponse(req);
  const chunks: Buffer[] = [];

  res.write = ((chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return true;
  }) as unknown as ServerResponse['write'];

  const responseDone = new Promise<{ status: number; json: Record<string, any> }>((resolve) => {
    res.end = ((chunk?: Buffer | string) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      let json: Record<string, any> = {};
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        json = { raw };
      }
      resolve({ status: res.statusCode, json });
      return res;
    }) as unknown as ServerResponse['end'];
  });

  app(req, res);

  if (payload) {
    (req as unknown as PassThrough).push(payload);
  }
  (req as unknown as PassThrough).push(null);

  return responseDone;
}

beforeAll(() => {
  app = createApp({ dbPath: ':memory:' });
});

afterAll(() => {
  closeDb();
});

describe('CARE BRIDGE Full End-to-End Integration Flow (ESAI.docx aligned)', () => {
  let createdRequestId = '';
  let kaderToken = '';
  let konselorToken = '';
  let createdSupervisionId = '';

  it('serves initial seeded education articles across categories', async () => {
    const res = await apiFetch('/api/articles');
    expect(res.status).toBe(200);
    expect(res.json.articles.length).toBeGreaterThanOrEqual(7);
  });

  it('rejects unauthenticated access to protected dashboard routes', async () => {
    const res = await apiFetch('/api/requests');
    expect(res.status).toBe(401);
  });

  it('analyzes different screening answers dynamically without returning the same static result', async () => {
    // Case A: Stable answers -> edukasi (no request created)
    const eduRes = await apiFetch('/api/screenings', {
      method: 'POST',
      body: {
        understoodConfidentiality: true,
        agreedToProceed: true,
        isAnonymous: true,
        nickname: '',
        ageRange: '26-40 tahun',
        locationPost: 'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
        agreedFollowUpContact: false,
        contactInfo: '',
        safetyStatus: 'aman',
        emotionalState: 'tenang_terkendali',
        sleepDifficulty: 'tidak_ada',
        activityDifficulty: 'tidak',
        primaryNeed: 'Informasi layanan dan bantuan posko',
        additionalNotes: '',
        hasTrustedSupport: 'ya',
        practicalNeeds: ['Tidak ada kebutuhan praktis mendesak'],
        socialSupportNeeded: ['Informasi praktis cara menenangkan diri'],
        companionPreference: 'cukup_informasi',
      },
    });
    expect(eduRes.status).toBe(201);
    expect(eduRes.json.decision.track).toBe('edukasi');
    expect(eduRes.json.createdRequest).toBeNull();

    // Case B: Distressed / sleep issues + wants kader -> kader request created with rule traceability
    const kaderRes = await apiFetch('/api/screenings', {
      method: 'POST',
      body: {
        understoodConfidentiality: true,
        agreedToProceed: true,
        isAnonymous: true,
        nickname: '',
        ageRange: '26-40 tahun',
        locationPost: 'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
        agreedFollowUpContact: true,
        contactInfo: 'Tenda B3 Simulasi',
        safetyStatus: 'kurang_aman',
        emotionalState: 'cemas_sedih_ringan',
        sleepDifficulty: 'sering_sulit_tidur',
        activityDifficulty: 'cukup_terganggu',
        primaryNeed: 'Butuh teman bicara dan teknik tenang',
        additionalNotes: 'Sulit tidur sejak kemarin',
        hasTrustedSupport: 'terbatas',
        practicalNeeds: ['Informasi layanan dan bantuan posko'],
        socialSupportNeeded: ['Teman bicara yang mendengarkan tanpa menghakimi'],
        companionPreference: 'ingin_berbicara_kader',
        sendRequestToQueue: true,
      },
    });

    expect(kaderRes.status).toBe(201);
    expect(kaderRes.json.decision.track).toBe('kader');
    expect(kaderRes.json.decision.matchedRules.length).toBeGreaterThan(0);
    expect(kaderRes.json.createdRequest).toBeTruthy();
    expect(kaderRes.json.createdRequest.status).toBe('baru');
    createdRequestId = kaderRes.json.createdRequest.id;
  });

  it('allows quick pendamping request without screening', async () => {
    const res = await apiFetch('/api/requests/quick', {
      method: 'POST',
      body: {
        isAnonymous: true,
        locationPost: 'Posko Sigli (Pidie)',
        primaryNeed: 'Butuh teman bicara segera',
        preferredTrack: 'kader',
        agreedFollowUpContact: false,
        consentGiven: true,
      },
    });
    expect(res.status).toBe(201);
    expect(res.json.request.status).toBe('baru');
  });

  it('logs in as Kader, enforces role isolation, accepts request, records follow-up, and requests urgent supervision', async () => {
    const login = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { username: 'kader.aceh', password: 'kader123' },
    });
    expect(login.status).toBe(200);
    expect(login.json.user.role).toBe('kader');
    kaderToken = login.json.token;

    // Role isolation
    const forbiddenStats = await apiFetch('/api/stats/konselor', { token: kaderToken });
    expect(forbiddenStats.status).toBe(403);
    const forbiddenRef = await apiFetch('/api/referrals', { token: kaderToken });
    expect(forbiddenRef.status).toBe(403);

    const listRes = await apiFetch('/api/requests', { token: kaderToken });
    expect(listRes.status).toBe(200);
    const found = listRes.json.requests.find((r: { id: string }) => r.id === createdRequestId);
    expect(found).toBeTruthy();
    expect(found.counselorFollowUpSummary).toBeNull();

    const acceptRes = await apiFetch(`/api/requests/${createdRequestId}/accept`, {
      method: 'PATCH',
      token: kaderToken,
    });
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.json.request.status).toBe('dalam_proses');

    const fuRes = await apiFetch(`/api/requests/${createdRequestId}/follow-ups`, {
      method: 'POST',
      token: kaderToken,
      body: { note: 'Sudah menemani penyintas di Tenda B3 dan melatih napas 4-4-6.' },
    });
    expect(fuRes.status).toBe(201);

    const supRes = await apiFetch('/api/supervisions', {
      method: 'POST',
      token: kaderToken,
      body: {
        requestId: createdRequestId,
        supervisionType: 'konsultasi_segera',
        reason: 'Penyintas masih sulit tidur 4 hari berturut-turut',
        kaderSummary: 'Sudah didampingi awal, mohon arahan konselor.',
      },
    });
    expect(supRes.status).toBe(201);
    expect(supRes.json.supervision.supervisionType).toBe('konsultasi_segera');
    expect(supRes.json.supervision.status).toBe('menunggu');
    createdSupervisionId = supRes.json.supervision.id;
  });

  it('logs in as Konselor, responds to supervision, checks process evaluation stats, and Kader sees the guidance', async () => {
    const login = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { username: 'konselor.ratna', password: 'konselor123' },
    });
    expect(login.status).toBe(200);
    expect(login.json.user.role).toBe('konselor');
    konselorToken = login.json.token;

    const supList = await apiFetch('/api/supervisions', { token: konselorToken });
    expect(supList.status).toBe(200);
    expect(supList.json.supervisions.some((s: { id: string }) => s.id === createdSupervisionId)).toBe(
      true,
    );

    const respondRes = await apiFetch(`/api/supervisions/${createdSupervisionId}`, {
      method: 'PATCH',
      token: konselorToken,
      body: {
        status: 'arahan_dikirim',
        counselorGuidance: 'Lanjutkan pendampingan tidur terstruktur dan evaluasi dalam 2 hari.',
        requestStatusAfter: 'dalam_proses',
      },
    });
    expect(respondRes.status).toBe(200);
    expect(respondRes.json.supervision.status).toBe('arahan_dikirim');

    const kaderDetail = await apiFetch(`/api/requests/${createdRequestId}`, { token: kaderToken });
    expect(kaderDetail.status).toBe(200);
    expect(kaderDetail.json.request.status).toBe('dalam_proses');
    expect(kaderDetail.json.request.supervisionGuidance).toContain('Lanjutkan pendampingan tidur');

    const statsRes = await apiFetch('/api/stats/konselor', { token: konselorToken });
    expect(statsRes.status).toBe(200);
    expect(statsRes.json.processEvaluation).toBeTruthy();
    expect(statsRes.json.processEvaluation.supervisionHandledCount).toBeGreaterThanOrEqual(2);
  });

  it('publishes an education article as Konselor, CARE Assistant retrieves it, and error reporting works', async () => {
    const createArt = await apiFetch('/api/articles', {
      method: 'POST',
      token: konselorToken,
      body: {
        title: 'Panduan Tidur Nyenyak Pascagempa Susulan Aceh',
        summary: 'Langkah sederhana menenangkan sistem saraf sebelum istirahat malam di pengungsian.',
        content:
          'Untuk membantu tidur lebih nyenyak setelah gempa susulan di posko, kurangi kafein sore hari, lakukan napas 4-4-6, dan pastikan berada bersama keluarga atau relawan posko yang dipercaya.',
        category: 'Teknik sederhana untuk menenangkan diri',
        referenceSource: 'Panduan Simulasi CARE BRIDGE Aceh',
        status: 'published',
        readTimeMinutes: 3,
      },
    });
    expect(createArt.status).toBe(201);

    const chatRes = await apiFetch('/api/assistant/chat', {
      method: 'POST',
      body: {
        sessionId: 'e2e-chat-01',
        message: 'Bagaimana panduan tidur nyenyak pascagempa susulan Aceh?',
      },
    });
    expect(chatRes.status).toBe(200);
    expect(chatRes.json.assistantMessage.sources.length).toBeGreaterThan(0);

    const reportRes = await apiFetch('/api/assistant/report', {
      method: 'POST',
      body: {
        sessionId: 'e2e-chat-01',
        messageId: chatRes.json.assistantMessage.id,
        reason: 'Contoh pengujian pelaporan jawaban oleh pengguna.',
      },
    });
    expect(reportRes.status).toBe(201);

    const crisisRes = await apiFetch('/api/assistant/chat', {
      method: 'POST',
      body: {
        sessionId: 'e2e-chat-01',
        message: 'Saya merasa putus asa dan ingin menyakiti diri',
      },
    });
    expect(crisisRes.status).toBe(200);
    expect(crisisRes.json.assistantMessage.isEmergencyFlag).toBe(true);
  });

  it('completes case, logs out, and resets demo data cleanly', async () => {
    const completeRes = await apiFetch(`/api/requests/${createdRequestId}/complete`, {
      method: 'POST',
      token: kaderToken,
      body: { closingNote: 'Penyintas membaik dan telah memiliki dukungan keluarga.' },
    });
    expect(completeRes.status).toBe(200);
    expect(completeRes.json.request.status).toBe('selesai');

    await apiFetch('/api/auth/logout', { method: 'POST', token: kaderToken });
    const afterLogout = await apiFetch('/api/requests', { token: kaderToken });
    expect(afterLogout.status).toBe(401);

    const resetRes = await apiFetch('/api/demo/reset', {
      method: 'POST',
      token: konselorToken,
    });
    expect(resetRes.status).toBe(200);
    expect(resetRes.json.ok).toBe(true);
  });
});
