import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateScreeningDecision } from '../shared/decisionEngine.js';
import type { ScreeningInput } from '../shared/types.js';
import {
  screeningBasicInfoSchema,
  screeningConditionSchema,
  screeningConsentSchema,
} from '../shared/validation.js';

describe('Screening Validation, Recalculation & Reduced-Motion Accessibility', () => {
  it('enforces explicit consent before proceeding', () => {
    const fail = screeningConsentSchema.safeParse({
      understoodConfidentiality: false,
      agreedToProceed: true,
    });
    expect(fail.success).toBe(false);

    const pass = screeningConsentSchema.safeParse({
      understoodConfidentiality: true,
      agreedToProceed: true,
    });
    expect(pass.success).toBe(true);
  });

  it('requires contact info only when follow-up contact consent is checked', () => {
    const anonWithoutContact = screeningBasicInfoSchema.safeParse({
      isAnonymous: true,
      nickname: '',
      ageRange: '26-40 tahun',
      locationPost: 'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
      agreedFollowUpContact: false,
      contactInfo: '',
    });
    expect(anonWithoutContact.success).toBe(true);

    const missingContactWhenAgreed = screeningBasicInfoSchema.safeParse({
      isAnonymous: true,
      nickname: '',
      ageRange: '26-40 tahun',
      locationPost: 'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
      agreedFollowUpContact: true,
      contactInfo: '',
    });
    expect(missingContactWhenAgreed.success).toBe(false);
  });

  it('validates condition step inputs without requiring detailed trauma narrative', () => {
    const valid = screeningConditionSchema.safeParse({
      safetyStatus: 'aman',
      emotionalState: 'cemas_sedih_ringan',
      sleepDifficulty: 'kadang',
      activityDifficulty: 'sedikit',
      primaryNeed: 'Ingin menenangkan diri & mengatasi rasa cemas',
      additionalNotes: '',
    });
    expect(valid.success).toBe(true);
  });

  it('consistently recalculates recommendation when user edits answers back and forth', () => {
    const base: ScreeningInput = {
      understoodConfidentiality: true,
      agreedToProceed: true,
      isAnonymous: true,
      nickname: '',
      ageRange: '26-40 tahun',
      locationPost: 'Posko Sigli (Pidie)',
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
    };

    // 1. Initial -> edukasi
    expect(evaluateScreeningDecision(base).track).toBe('edukasi');

    // 2. User changes emotionalState & activityDifficulty -> konselor
    const elevated = evaluateScreeningDecision({
      ...base,
      emotionalState: 'tertekan_berat',
      activityDifficulty: 'sangat_terganggu',
    });
    expect(elevated.track).toBe('konselor');

    // 3. User triggers safety risk -> bantuan_segera overrides everything
    const urgent = evaluateScreeningDecision({
      ...base,
      emotionalState: 'tertekan_berat',
      activityDifficulty: 'sangat_terganggu',
      safetyStatus: 'bahaya_langsung',
    });
    expect(urgent.track).toBe('bantuan_segera');
    expect(urgent.isImmediateHelp).toBe(true);

    // 4. User corrects back to aman + tenang -> returns cleanly to edukasi
    const reverted = evaluateScreeningDecision(base);
    expect(reverted.track).toBe('edukasi');
    expect(reverted.isImmediateHelp).toBe(false);
  });

  it('contains prefers-reduced-motion media rule and kiosk motion disablement in index.css', () => {
    const css = fs.readFileSync(
      path.resolve(process.cwd(), 'client', 'src', 'index.css'),
      'utf-8',
    );
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('.cb-kiosk-mode .cb-soft-float');
    expect(css).toContain('@media (hover: hover)');
  });
});
