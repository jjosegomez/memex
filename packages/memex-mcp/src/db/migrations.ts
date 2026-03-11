import type Database from 'better-sqlite3';

export const CURRENT_SCHEMA_VERSION = 2;

const SCHEMA_V1 = `
-- Main memories table
CREATE TABLE IF NOT EXISTS memories (
    id              TEXT PRIMARY KEY,
    project         TEXT NOT NULL,
    content_enc     BLOB NOT NULL,
    iv              BLOB NOT NULL,
    auth_tag        BLOB NOT NULL,
    tags            TEXT DEFAULT '[]',
    content_hash    TEXT NOT NULL,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    deleted_at      TEXT DEFAULT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project);
CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);
CREATE INDEX IF NOT EXISTS idx_memories_hash ON memories(content_hash);

-- FTS5 virtual table for full-text search (standalone, not external content)
-- We manage content manually since the memories table stores encrypted blobs,
-- not plaintext. Plaintext is inserted into FTS at write time by application code.
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
    id UNINDEXED,
    content,
    tags,
    project UNINDEXED
);

-- Metadata table for config/state
CREATE TABLE IF NOT EXISTS meta (
    key     TEXT PRIMARY KEY,
    value   TEXT NOT NULL
);
`;

const SCHEMA_V2 = `
-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id              TEXT PRIMARY KEY,
    project         TEXT NOT NULL,
    agent_source    TEXT NOT NULL,
    title           TEXT DEFAULT NULL,
    summary_enc     BLOB DEFAULT NULL,
    summary_iv      BLOB DEFAULT NULL,
    summary_auth_tag BLOB DEFAULT NULL,
    tags            TEXT DEFAULT '[]',
    event_count     INTEGER DEFAULT 0,
    started_at      TEXT NOT NULL,
    ended_at        TEXT DEFAULT NULL,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project);
CREATE INDEX IF NOT EXISTS idx_sessions_agent ON sessions(agent_source);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_ended ON sessions(ended_at);

-- Session events table
CREATE TABLE IF NOT EXISTS session_events (
    id              TEXT PRIMARY KEY,
    session_id      TEXT NOT NULL,
    sequence        INTEGER NOT NULL,
    event_type      TEXT NOT NULL,
    timestamp       TEXT NOT NULL,
    duration_ms     INTEGER DEFAULT NULL,
    content_enc     BLOB NOT NULL,
    iv              BLOB NOT NULL,
    auth_tag        BLOB NOT NULL,
    metadata        TEXT DEFAULT NULL,
    agent_source    TEXT DEFAULT NULL,
    created_at      TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_events_session ON session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_type ON session_events(event_type);
CREATE INDEX IF NOT EXISTS idx_session_events_timestamp ON session_events(timestamp);
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_events_session_seq ON session_events(session_id, sequence);

-- FTS5 for session content search
CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(
    event_id UNINDEXED,
    session_id UNINDEXED,
    content,
    event_type UNINDEXED,
    project UNINDEXED
);
`;

/**
 * Get the current schema version from the meta table.
 * Returns 0 if the meta table doesn't exist yet.
 */
function getSchemaVersion(db: Database.Database): number {
  try {
    const row = db
      .prepare("SELECT value FROM meta WHERE key = 'schema_version'")
      .get() as { value: string } | undefined;
    return row ? parseInt(row.value, 10) : 0;
  } catch {
    // meta table doesn't exist yet
    return 0;
  }
}

/**
 * Set the schema version in the meta table.
 */
function setSchemaVersion(db: Database.Database, version: number): void {
  db.prepare(
    "INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)",
  ).run(String(version));
}

/**
 * Run all pending migrations.
 */
export function migrate(db: Database.Database): void {
  const version = getSchemaVersion(db);

  if (version < 1) {
    db.exec(SCHEMA_V1);
    setSchemaVersion(db, 1);
  }

  if (version < 2) {
    db.exec(SCHEMA_V2);
    setSchemaVersion(db, 2);
  }
}
