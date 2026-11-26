import type {
  AuditEvent,
  ChatMessage,
  DecisionResult,
  EducationArticle,
  KaderDashboardStats,
  KnowledgeDocument,
  KonselorDashboardStats,
  ReferralRecord,
  ScreeningInput,
  SupervisionRequest,
  SupportRequest,
  User,
} from '@shared/types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const TOKEN_STORAGE_KEY = 'cb_demo_token';

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || 'Terjadi kesalahan saat menghubungi layanan.');
  }
  return data as T;
}

export const api = {
  auth: {
    me: () => request<{ user: User | null; isAuthenticated: boolean }>('/api/auth/me'),
    login: (username: string, password: string) =>
      request<{ token: string; user: User; prototypeNotice: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  },

  screening: {
    submit: (payload: ScreeningInput) =>
      request<{
        sessionId: string;
        consentId: string;
        anonymousCode: string;
        decision: DecisionResult;
        createdRequest: {
          id: string;
          anonymousCode: string;
          status: string;
          serviceTrack: string;
        } | null;
        submittedAt: string;
      }>('/api/screenings', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    submitQuickHelp: (payload: {
      isAnonymous: boolean;
      nickname?: string;
      locationPost: string;
      primaryNeed: string;
      preferredTrack: 'kader' | 'konselor' | 'bantuan_segera';
      agreedFollowUpContact: boolean;
      contactInfo?: string;
      consentGiven: true;
    }) =>
      request<{
        request: {
          id: string;
          anonymousCode: string;
          status: string;
          serviceTrack: string;
          locationPost: string;
          createdAt: string;
        };
      }>('/api/requests/quick', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  requests: {
    list: (params?: { status?: string; track?: string; search?: string }) => {
      const sp = new URLSearchParams();
      if (params?.status) sp.set('status', params.status);
      if (params?.track) sp.set('track', params.track);
      if (params?.search) sp.set('search', params.search);
      const q = sp.toString();
      return request<{ requests: SupportRequest[] }>(`/api/requests${q ? `?${q}` : ''}`);
    },
    getById: (id: string) => request<{ request: SupportRequest }>(`/api/requests/${id}`),
    accept: (id: string) =>
      request<{ request: SupportRequest }>(`/api/requests/${id}/accept`, {
        method: 'PATCH',
      }),
    addFollowUp: (
      id: string,
      payload: {
        note: string;
        nextStatus?: 'dalam_proses' | 'perlu_supervisi' | 'menunggu_rujukan' | 'selesai';
        isCounselorOnly?: boolean;
      },
    ) =>
      request<{ followUpId: string; request: SupportRequest }>(
        `/api/requests/${id}/follow-ups`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      ),
    complete: (id: string, closingNote: string) =>
      request<{ request: SupportRequest }>(`/api/requests/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ closingNote }),
      }),
  },

  supervisions: {
    list: () => request<{ supervisions: SupervisionRequest[] }>('/api/supervisions'),
    create: (payload: {
      requestId: string;
      supervisionType?: 'terjadwal' | 'konsultasi_segera';
      reason: string;
      kaderSummary: string;
    }) =>
      request<{ supervision: SupervisionRequest }>('/api/supervisions', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    respond: (
      id: string,
      payload: {
        status: 'menunggu' | 'ditinjau' | 'arahan_dikirim' | 'selesai';
        counselorGuidance: string;
        requestStatusAfter?: 'dalam_proses' | 'perlu_supervisi' | 'menunggu_rujukan' | 'selesai';
      },
    ) =>
      request<{ supervision: SupervisionRequest }>(`/api/supervisions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },

  referrals: {
    list: () => request<{ referrals: ReferralRecord[] }>('/api/referrals'),
    create: (payload: {
      requestId: string;
      destinationFacility: string;
      referralType: string;
      summaryNote: string;
      status: 'direncanakan' | 'dikonfirmasi' | 'selesai';
    }) =>
      request<{ referral: ReferralRecord }>('/api/referrals', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (
      id: string,
      payload: {
        status: 'direncanakan' | 'dikonfirmasi' | 'selesai';
        summaryNote?: string;
        destinationFacility?: string;
      },
    ) =>
      request<{ referral: ReferralRecord }>(`/api/referrals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },

  education: {
    list: (params?: { category?: string; search?: string; includeDrafts?: boolean }) => {
      const sp = new URLSearchParams();
      if (params?.category) sp.set('category', params.category);
      if (params?.search) sp.set('search', params.search);
      if (params?.includeDrafts) sp.set('includeDrafts', 'true');
      const q = sp.toString();
      return request<{ articles: EducationArticle[] }>(`/api/articles${q ? `?${q}` : ''}`);
    },
    getBySlug: (slug: string) =>
      request<{ article: EducationArticle; related: EducationArticle[] }>(
        `/api/articles/${encodeURIComponent(slug)}`,
      ),
    create: (payload: {
      title: string;
      summary: string;
      content: string;
      category: string;
      referenceSource: string;
      status: 'published' | 'draft';
      readTimeMinutes?: number;
    }) =>
      request<{ article: EducationArticle }>('/api/articles', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (
      id: string,
      payload: {
        title: string;
        summary: string;
        content: string;
        category: string;
        referenceSource: string;
        status: 'published' | 'draft';
        readTimeMinutes?: number;
      },
    ) =>
      request<{ article: EducationArticle }>(`/api/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<{ ok: boolean; id: string }>(`/api/articles/${id}`, {
        method: 'DELETE',
      }),
    listKnowledge: () => request<{ documents: KnowledgeDocument[] }>('/api/knowledge'),
  },

  assistant: {
    getSuggestions: () =>
      request<{ suggestions: string[]; disclaimer: string }>('/api/assistant/suggestions'),
    sendMessage: (sessionId: string, message: string) =>
      request<{
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
        disclaimer: string;
      }>('/api/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ sessionId, message }),
      }),
    reportError: (sessionId: string, messageId: string, reason: string) =>
      request<{ ok: boolean; message: string }>('/api/assistant/report', {
        method: 'POST',
        body: JSON.stringify({ sessionId, messageId, reason }),
      }),
  },

  stats: {
    kader: () => request<KaderDashboardStats>('/api/stats/kader'),
    konselor: (params?: { months?: number; category?: string }) => {
      const sp = new URLSearchParams();
      if (params?.months) sp.set('months', String(params.months));
      if (params?.category) sp.set('category', params.category);
      const q = sp.toString();
      return request<KonselorDashboardStats>(`/api/stats/konselor${q ? `?${q}` : ''}`);
    },
    audit: () => request<{ events: AuditEvent[] }>('/api/stats/audit'),
  },

  demo: {
    reset: () => request<{ ok: boolean; message: string }>('/api/demo/reset', { method: 'POST' }),
  },
};
