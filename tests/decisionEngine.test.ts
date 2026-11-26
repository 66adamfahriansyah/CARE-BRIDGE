import { describe, expect, it } from 'vitest';
import { evaluateScreeningDecision } from '../shared/decisionEngine.js';
import type { ScreeningInput } from '../shared/types.js';

const stableBaseInput: ScreeningInput = {
  understoodConfidentiality: true,
  agreedToProceed: true,
  isAnonymous: true,
  nickname: '',
  ageRange: '26-40 tahun',
  locationPost: 'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
  agreedFollowUpContact: false,
  contactInfo: '',
  safetyStatus: 'aman',
  emotionalState: 'cemas_sedih_ringan',
  sleepDifficulty: 'kadang',
  activityDifficulty: 'sedikit',
  primaryNeed: 'Ingin menenangkan diri & mengatasi rasa cemas',
  additionalNotes: '',
  hasTrustedSupport: 'ya',
  practicalNeeds: ['Tidak ada kebutuhan praktis mendesak'],
  socialSupportNeeded: ['Informasi praktis cara menenangkan diri'],
  companionPreference: 'cukup_informasi',
};

describe('Rule-Based Decision System aligned with ESAI.docx', () => {
  it('routes stable answers with info preference to self-education without creating queue ticket', () => {
    const res = evaluateScreeningDecision(stableBaseInput);
    expect(res.track).toBe('edukasi');
    expect(res.shouldCreateRequest).toBe(false);
    expect(res.initialStatus).toBeNull();
    expect(res.isImmediateHelp).toBe(false);
    expect(res.matchedRules[0].code).toBe('RULE_SELF_EDUCATION_AND_PFA_INFO');
  });

  it('recalculates to kader recommendation when answers show disrupted sleep/activity or lack of support even if preference was cukup_informasi', () => {
    const res = evaluateScreeningDecision({
      ...stableBaseInput,
      sleepDifficulty: 'sering_sulit_tidur',
      activityDifficulty: 'cukup_terganggu',
      hasTrustedSupport: 'tidak_ada',
      companionPreference: 'cukup_informasi',
    });
    expect(res.track).toBe('kader');
    expect(res.matchedRules[0].code).toBe('RULE_KADER_COMMUNITY_COMPANION');
    expect(res.matchedRules[0].triggeredBy.length).toBeGreaterThanOrEqual(2);
    // Still respects voluntary consent unless opted in
    expect(res.shouldCreateRequest).toBe(false);

    // When user opts in or selects ingin_berbicara_kader, creates kader request
    const optedIn = evaluateScreeningDecision({
      ...stableBaseInput,
      companionPreference: 'ingin_berbicara_kader',
    });
    expect(optedIn.track).toBe('kader');
    expect(optedIn.shouldCreateRequest).toBe(true);
    expect(optedIn.initialStatus).toBe('baru');
  });

  it('recalculates to konselor recommendation when answers indicate severe emotional strain + severe daily disruption', () => {
    const res = evaluateScreeningDecision({
      ...stableBaseInput,
      emotionalState: 'tertekan_berat',
      activityDifficulty: 'sangat_terganggu',
      companionPreference: 'ingin_berbicara_kader',
    });
    expect(res.track).toBe('konselor');
    expect(res.matchedRules[0].code).toBe('RULE_COUNSELOR_PROFESSIONAL_NEED');
    expect(res.shouldCreateRequest).toBe(true);
    expect(res.initialStatus).toBe('baru');
    expect(res.needsProfessionalValidationNote).toContain('validasi instrumen');
  });

  it('triggers immediate safety escalation when safetyStatus is bahaya_langsung regardless of preference', () => {
    const res = evaluateScreeningDecision({
      ...stableBaseInput,
      safetyStatus: 'bahaya_langsung',
      companionPreference: 'cukup_informasi',
    });
    expect(res.track).toBe('bantuan_segera');
    expect(res.isImmediateHelp).toBe(true);
    expect(res.matchedRules[0].code).toBe('RULE_IMMEDIATE_SAFETY_ESCALATION');
    expect(res.disclaimer).toContain('BUKAN diagnosis psikologis');
  });
});
