import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance: DatabaseSync | null = null;
let currentDbPath: string | null = null;

function resolveSchemaPath(): string {
  const candidates = [
    path.resolve(__dirname, 'schema.sql'),
    path.resolve(process.cwd(), 'server', 'db', 'schema.sql'),
    path.resolve(__dirname, '..', 'server', 'db', 'schema.sql'),
    path.resolve(__dirname, '..', '..', 'server', 'db', 'schema.sql'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[1];
}

export function getDb(overridePath?: string): DatabaseSync {
  if (!overridePath && dbInstance) {
    return dbInstance;
  }

  const defaultDbPath = process.env.VERCEL
    ? path.join(os.tmpdir(), 'carebridge.db')
    : path.resolve(process.cwd(), 'data', 'carebridge.db');

  const targetPath =
    overridePath ??
    process.env.CARE_BRIDGE_DB_PATH ??
    defaultDbPath;

  if (dbInstance && currentDbPath === targetPath) {
    return dbInstance;
  }

  if (dbInstance) {
    dbInstance.close();
  }

  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(targetPath);
  db.exec('PRAGMA foreign_keys = ON;');
  if (targetPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }

  const schemaSql = fs.readFileSync(resolveSchemaPath(), 'utf-8');
  db.exec(schemaSql);

  const migrationRow = db
    .prepare('SELECT version FROM schema_migrations WHERE version = 1')
    .get() as { version: number } | undefined;

  if (!migrationRow) {
    db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (1, ?)').run(
      new Date().toISOString(),
    );
  }

  // Upgrade existing v1 SQLite files cleanly to v2 columns
  const migrationV2 = db
    .prepare('SELECT version FROM schema_migrations WHERE version = 2')
    .get() as { version: number } | undefined;

  if (!migrationV2) {
    const ensureColumn = (table: string, col: string, ddl: string) => {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
      if (!cols.some((c) => c.name === col)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl};`);
      }
    };
    ensureColumn('screening_sessions', 'safety_status', "safety_status TEXT NOT NULL DEFAULT 'aman'");
    ensureColumn('screening_sessions', 'emotional_state', "emotional_state TEXT NOT NULL DEFAULT 'cemas_sedih_ringan'");
    ensureColumn('screening_sessions', 'sleep_difficulty', "sleep_difficulty TEXT NOT NULL DEFAULT 'kadang'");
    ensureColumn('screening_sessions', 'practical_needs_json', "practical_needs_json TEXT NOT NULL DEFAULT '[]'");
    ensureColumn('screening_sessions', 'matched_rules_json', "matched_rules_json TEXT NOT NULL DEFAULT '[]'");
    ensureColumn('supervision_requests', 'supervision_type', "supervision_type TEXT NOT NULL DEFAULT 'terjadwal'");
    db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (2, ?)').run(
      new Date().toISOString(),
    );
  }

  dbInstance = db;
  currentDbPath = targetPath;
  return db;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    currentDbPath = null;
  }
}

export function withTransaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}

export function queryOne<T>(
  db: DatabaseSync,
  sql: string,
  ...params: Array<string | number | null>
): T | undefined {
  return db.prepare(sql).get(...params) as unknown as T | undefined;
}

export function queryAll<T>(
  db: DatabaseSync,
  sql: string,
  ...params: Array<string | number | null>
): T[] {
  return db.prepare(sql).all(...params) as unknown as T[];
}

