export type Role = 'kader' | 'konselor';

export type SupportRequestStatus =
  | 'baru'
  | 'dalam_proses'
  | 'perlu_supervisi'
  | 'menunggu_rujukan'
  | 'selesai';

export type ServiceTrack = 'edukasi' | 'kader' | 'konselor' | 'bantuan_segera';

export type SupervisionType = 'terjadwal' | 'konsultasi_segera';

export type SupervisionStatus = 'menunggu' | 'ditinjau' | 'arahan_dikirim' | 'selesai';

export type ReferralStatus = 'direncanakan' | 'dikonfirmasi' | 'selesai';

export type ArticleStatus = 'published' | 'draft';

export type SafetyStatus = 'aman' | 'kurang_aman' | 'bahaya_langsung';
export type EmotionalState = 'tenang_terkendali' | 'cemas_sedih_ringan' | 'tertekan_berat';
export type SleepDifficulty = 'tidak_ada' | 'kadang' | 'sering_sulit_tidur';
export type ActivityDifficulty = 'tidak' | 'sedikit' | 'cukup_terganggu' | 'sangat_terganggu';
export type CompanionPreference =
  | 'cukup_informasi'
  | 'ingin_berbicara_kader'
  | 'ingin_konselor'
  | 'butuh_bantuan_segera';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  title: string;
  locationPost: string;
}

export interface ConsentRecord {
  id: string;
  sessionId: string;
  understoodConfidentiality: boolean;
  agreedToProceed: boolean;
  agreedFollowUpContact: boolean;
  consentTimestamp: string;
  withdrawnAt?: string | null;
}

export interface ScreeningInput {
  understoodConfidentiality: boolean;
  agreedToProceed: boolean;
  isAnonymous: boolean;
  nickname: string;
  ageRange: string;
  locationPost: string;
  agreedFollowUpContact: boolean;
  contactInfo: string;
  safetyStatus: SafetyStatus;
  emotionalState: EmotionalState;
  sleepDifficulty: SleepDifficulty;
  activityDifficulty: ActivityDifficulty;
  primaryNeed: string;
  additionalNotes: string;
  hasTrustedSupport: 'ya' | 'terbatas' | 'tidak_ada';
  practicalNeeds: string[];
  socialSupportNeeded: string[];
  companionPreference: CompanionPreference;
  sendRequestToQueue?: boolean;
}

export interface MatchedRuleTrace {
  code: string;
  label: string;
  triggeredBy: string[];
  basisInEssay: string;
}

export interface DecisionResult {
  track: ServiceTrack;
  summaryTitle: string;
  summaryDescription: string;
  reasoningSummary: string;
  needBadgeLabel: string;
  shouldCreateRequest: boolean;
  initialStatus: SupportRequestStatus | null;
  isImmediateHelp: boolean;
  authorityNote: string;
  needsProfessionalValidationNote: string;
  matchedRules: MatchedRuleTrace[];
  recommendedCategories: string[];
  nextSteps: string[];
  disclaimer: string;
  ruleCode: string;
}

export interface ScreeningSession {
  id: string;
  consentId: string;
  anonymousCode: string;
  ageRange: string;
  locationPost: string;
  safetyStatus: SafetyStatus;
  emotionalState: EmotionalState;
  sleepDifficulty: SleepDifficulty;
  primaryNeed: string;
  activityDifficulty: ActivityDifficulty;
  hasTrustedSupport: ScreeningInput['hasTrustedSupport'];
  practicalNeeds: string[];
  socialSupportNeeded: string[];
  companionPreference: CompanionPreference;
  recommendedTrack: ServiceTrack;
  matchedRules: MatchedRuleTrace[];
  createdAt: string;
}

export interface FollowUpRecord {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  note: string;
  actionType:
    | 'penerimaan'
    | 'catatan_kader'
    | 'pengajuan_supervisi'
    | 'arahan_supervisi'
    | 'tindak_lanjut_konselor'
    | 'rujukan'
    | 'selesai';
  isCounselorOnly: boolean;
  createdAt: string;
}

export interface SupervisionRequest {
  id: string;
  requestId: string;
  anonymousCode: string;
  kaderId: string;
  kaderName: string;
  supervisionType: SupervisionType;
  reason: string;
  kaderSummary: string;
  status: SupervisionStatus;
  counselorId?: string | null;
  counselorName?: string | null;
  counselorGuidance?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralRecord {
  id: string;
  requestId: string;
  anonymousCode: string;
  counselorId: string;
  counselorName: string;
  destinationFacility: string;
  referralType: string;
  summaryNote: string;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupportRequest {
  id: string;
  screeningSessionId?: string | null;
  anonymousCode: string;
  displayName: string;
  ageRange: string;
  locationPost: string;
  contactAllowed: boolean;
  contactInfo?: string | null;
  primaryNeed: string;
  needSummary: string;
  activityDifficulty: string;
  socialSupportInfo: string;
  serviceTrack: ServiceTrack;
  status: SupportRequestStatus;
  sourceType: 'skrining' | 'permintaan_cepat';
  assignedKaderId?: string | null;
  assignedKaderName?: string | null;
  assignedCounselorId?: string | null;
  assignedCounselorName?: string | null;
  counselorFollowUpSummary?: string | null;
  supervisionGuidance?: string | null;
  createdAt: string;
  updatedAt: string;
  followUps?: FollowUpRecord[];
  supervisions?: SupervisionRequest[];
  referrals?: ReferralRecord[];
}

export interface EducationArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  referenceSource: string;
  status: ArticleStatus;
  authorName: string;
  readTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  referenceSource: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    id: string;
    title: string;
    category: string;
    referenceSource: string;
    slug?: string;
  }>;
  isEmergencyFlag?: boolean;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface AuditEvent {
  id: string;
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  detail: string;
  createdAt: string;
}

export interface KaderDashboardStats {
  permintaanBaru: number;
  dalamProses: number;
  perluSupervisi: number;
  selesai: number;
  activeAssignedCount: number;
  maxRecommendedCaseload: number;
  isDemoData: boolean;
}

export interface ProcessEvaluationMetrics {
  totalRequests: number;
  followedUpRatePercent: number;
  supervisionTotal: number;
  supervisionHandledCount: number;
  referralTotal: number;
  referralConfirmedOrDoneCount: number;
  aiErrorReportsCount: number;
  interpretationNote: string;
}

export interface KonselorDashboardStats {
  permintaanLayanan: number;
  supervisiKader: number;
  kasusLanjutan: number;
  rujukanDiproses: number;
  totalSelesai: number;
  monthlyTrend: Array<{
    month: string;
    permintaan: number;
    supervisi: number;
    selesai: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    total: number;
  }>;
  statusBreakdown: Array<{
    status: SupportRequestStatus;
    label: string;
    total: number;
  }>;
  processEvaluation: ProcessEvaluationMetrics;
  recentActivities: AuditEvent[];
  isDemoData: boolean;
}
