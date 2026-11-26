-- CARE BRIDGE Prototype SQLite Schema (v2)
-- Menggunakan SQLite relasional melalui node:sqlite untuk konsistensi penuh antarmodul.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('kader', 'konselor')),
  title TEXT NOT NULL,
  location_post TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS consent_records (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  understood_confidentiality INTEGER NOT NULL,
  agreed_to_proceed INTEGER NOT NULL,
  agreed_follow_up_contact INTEGER NOT NULL,
  consent_timestamp TEXT NOT NULL,
  withdrawn_at TEXT
);

CREATE TABLE IF NOT EXISTS screening_sessions (
  id TEXT PRIMARY KEY,
  consent_id TEXT NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,
  anonymous_code TEXT NOT NULL,
  age_range TEXT NOT NULL,
  location_post TEXT NOT NULL,
  safety_status TEXT NOT NULL DEFAULT 'aman',
  emotional_state TEXT NOT NULL DEFAULT 'cemas_sedih_ringan',
  sleep_difficulty TEXT NOT NULL DEFAULT 'kadang',
  primary_need TEXT NOT NULL,
  activity_difficulty TEXT NOT NULL,
  has_trusted_support TEXT NOT NULL,
  practical_needs_json TEXT NOT NULL DEFAULT '[]',
  social_support_needed_json TEXT NOT NULL,
  service_choice TEXT NOT NULL,
  recommended_track TEXT NOT NULL,
  matched_rules_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS support_requests (
  id TEXT PRIMARY KEY,
  screening_session_id TEXT REFERENCES screening_sessions(id) ON DELETE SET NULL,
  anonymous_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  age_range TEXT NOT NULL,
  location_post TEXT NOT NULL,
  contact_allowed INTEGER NOT NULL DEFAULT 0,
  contact_info TEXT,
  primary_need TEXT NOT NULL,
  need_summary TEXT NOT NULL,
  activity_difficulty TEXT NOT NULL,
  social_support_info TEXT NOT NULL,
  service_track TEXT NOT NULL CHECK (service_track IN ('edukasi', 'kader', 'konselor', 'bantuan_segera')),
  status TEXT NOT NULL CHECK (status IN ('baru', 'dalam_proses', 'perlu_supervisi', 'menunggu_rujukan', 'selesai')),
  source_type TEXT NOT NULL CHECK (source_type IN ('skrining', 'permintaan_cepat')),
  assigned_kader_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  assigned_kader_name TEXT,
  assigned_counselor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  assigned_counselor_name TEXT,
  counselor_follow_up_summary TEXT,
  supervision_guidance TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS follow_up_records (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  note TEXT NOT NULL,
  action_type TEXT NOT NULL,
  is_counselor_only INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS supervision_requests (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
  anonymous_code TEXT NOT NULL,
  kader_id TEXT NOT NULL,
  kader_name TEXT NOT NULL,
  supervision_type TEXT NOT NULL DEFAULT 'terjadwal' CHECK (supervision_type IN ('terjadwal', 'konsultasi_segera')),
  reason TEXT NOT NULL,
  kader_summary TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('menunggu', 'ditinjau', 'arahan_dikirim', 'selesai')),
  counselor_id TEXT,
  counselor_name TEXT,
  counselor_guidance TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS referral_records (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
  anonymous_code TEXT NOT NULL,
  counselor_id TEXT NOT NULL,
  counselor_name TEXT NOT NULL,
  destination_facility TEXT NOT NULL,
  referral_type TEXT NOT NULL,
  summary_note TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('direncanakan', 'dikonfirmasi', 'selesai')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS education_articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  reference_source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('published', 'draft')),
  author_name TEXT NOT NULL,
  read_time_minutes INTEGER NOT NULL DEFAULT 4,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  reference_source TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources_json TEXT,
  is_emergency_flag INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_track ON support_requests(service_track);
CREATE INDEX IF NOT EXISTS idx_follow_ups_request ON follow_up_records(request_id);
CREATE INDEX IF NOT EXISTS idx_supervisions_request ON supervision_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_referrals_request ON referral_records(request_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON education_articles(slug);
