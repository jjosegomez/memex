import type Database from 'better-sqlite3';

/**
 * Sanitize a user query string for safe use in FTS5 MATCH.
 */
function sanitizeFtsQuery(query: string): string {
  return query
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token) => `"${token.replace(/"/g, '""')}"`)
    .join(' ');
}

// --- Row types ---

export interface SessionRow {
  id: string;
  project: string;
  agent_source: string;
  title: string | null;
  summary_enc: Buffer | null;
  summary_iv: Buffer | null;
  summary_auth_tag: Buffer | null;
  tags: string;
  event_count: number;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionEventRow {
  id: string;
  session_id: string;
  sequence: number;
  event_type: string;
  timestamp: string;
  duration_ms: number | null;
  content_enc: Buffer;
  iv: Buffer;
  auth_tag: Buffer;
  metadata: string | null;
  agent_source: string | null;
  created_at: string;
}

// --- Session CRUD ---

export function insertSession(
  db: Database.Database,
  params: {
    id: string;
    project: string;
    agent_source: string;
    title?: string;
    tags: string[];
    started_at: string;
  },
): void {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO sessions (id, project, agent_source, title, tags, started_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    params.id,
    params.project,
    params.agent_source,
    params.title ?? null,
    JSON.stringify(params.tags),
    params.started_at,
    now,
    now,
  );
}

export function updateSessionEnd(
  db: Database.Database,
  params: {
    id: string;
    summaryEnc?: Buffer;
    summaryIv?: Buffer;
    summaryAuthTag?: Buffer;
    tags?: string[];
    ended_at: string;
    event_count: number;
  },
): boolean {
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE sessions
    SET ended_at = ?, event_count = ?, summary_enc = ?, summary_iv = ?, summary_auth_tag = ?,
        tags = COALESCE(?, tags), updated_at = ?
    WHERE id = ?
  `).run(
    params.ended_at,
    params.event_count,
    params.summaryEnc ?? null,
    params.summaryIv ?? null,
    params.summaryAuthTag ?? null,
    params.tags ? JSON.stringify(params.tags) : null,
    now,
    params.id,
  );
  return result.changes > 0;
}

export function getSessionById(
  db: Database.Database,
  id: string,
): SessionRow | undefined {
  return db
    .prepare(`SELECT * FROM sessions WHERE id = ?`)
    .get(id) as SessionRow | undefined;
}

export function listSessions(
  db: Database.Database,
  params: {
    project?: string;
    agent_source?: string;
    tags?: string[];
    status?: 'active' | 'ended' | 'all';
    limit: number;
    offset: number;
  },
): SessionRow[] {
  let sql = `SELECT * FROM sessions WHERE 1=1`;
  const bindParams: unknown[] = [];

  if (params.project) {
    sql += ` AND project = ?`;
    bindParams.push(params.project);
  }

  if (params.agent_source) {
    sql += ` AND agent_source = ?`;
    bindParams.push(params.agent_source);
  }

  if (params.tags && params.tags.length > 0) {
    sql += ` AND EXISTS (
      SELECT 1 FROM json_each(tags) je
      WHERE je.value IN (${params.tags.map(() => '?').join(',')})
    )`;
    bindParams.push(...params.tags);
  }

  if (params.status === 'active') {
    sql += ` AND ended_at IS NULL`;
  } else if (params.status === 'ended') {
    sql += ` AND ended_at IS NOT NULL`;
  }

  sql += ` ORDER BY started_at DESC LIMIT ? OFFSET ?`;
  bindParams.push(params.limit, params.offset);

  return db.prepare(sql).all(...bindParams) as SessionRow[];
}

export function getSessionCount(
  db: Database.Database,
  project?: string,
): number {
  if (project) {
    const row = db
      .prepare(`SELECT COUNT(*) as count FROM sessions WHERE project = ?`)
      .get(project) as { count: number };
    return row.count;
  }
  const row = db
    .prepare(`SELECT COUNT(*) as count FROM sessions`)
    .get() as { count: number };
  return row.count;
}

// --- Event CRUD ---

export function insertSessionEvent(
  db: Database.Database,
  params: {
    id: string;
    session_id: string;
    sequence: number;
    event_type: string;
    timestamp: string;
    duration_ms?: number;
    contentEnc: Buffer;
    iv: Buffer;
    authTag: Buffer;
    metadata?: Record<string, unknown>;
    agent_source?: string;
    content: string; // plaintext for FTS
    project: string; // for FTS
  },
): void {
  const now = new Date().toISOString();

  const insertEvent = db.prepare(`
    INSERT INTO session_events (id, session_id, sequence, event_type, timestamp, duration_ms,
      content_enc, iv, auth_tag, metadata, agent_source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFts = db.prepare(`
    INSERT INTO sessions_fts (event_id, session_id, content, event_type, project)
    VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertEvent.run(
      params.id,
      params.session_id,
      params.sequence,
      params.event_type,
      params.timestamp,
      params.duration_ms ?? null,
      params.contentEnc,
      params.iv,
      params.authTag,
      params.metadata ? JSON.stringify(params.metadata) : null,
      params.agent_source ?? null,
      now,
    );
    insertFts.run(
      params.id,
      params.session_id,
      params.content,
      params.event_type,
      params.project,
    );
  });

  transaction();
}

export function getSessionEvents(
  db: Database.Database,
  params: {
    session_id: string;
    event_types?: string[];
    limit: number;
    offset: number;
  },
): SessionEventRow[] {
  let sql = `SELECT * FROM session_events WHERE session_id = ?`;
  const bindParams: unknown[] = [params.session_id];

  if (params.event_types && params.event_types.length > 0) {
    sql += ` AND event_type IN (${params.event_types.map(() => '?').join(',')})`;
    bindParams.push(...params.event_types);
  }

  sql += ` ORDER BY sequence ASC LIMIT ? OFFSET ?`;
  bindParams.push(params.limit, params.offset);

  return db.prepare(sql).all(...bindParams) as SessionEventRow[];
}

export function getNextSequence(
  db: Database.Database,
  session_id: string,
): number {
  const row = db
    .prepare(`SELECT COALESCE(MAX(sequence), -1) + 1 as next_seq FROM session_events WHERE session_id = ?`)
    .get(session_id) as { next_seq: number };
  return row.next_seq;
}

export function getEventCount(
  db: Database.Database,
  session_id: string,
): number {
  const row = db
    .prepare(`SELECT COUNT(*) as count FROM session_events WHERE session_id = ?`)
    .get(session_id) as { count: number };
  return row.count;
}

// --- FTS Search ---

export function searchSessionContent(
  db: Database.Database,
  params: {
    query: string;
    project?: string;
    agent_source?: string;
    event_type?: string;
    limit: number;
  },
): Array<{
  event_id: string;
  session_id: string;
  event_type: string;
  project: string;
  rank: number;
}> {
  const sanitizedQuery = sanitizeFtsQuery(params.query);
  let sql = `
    SELECT fts.event_id, fts.session_id, fts.event_type, fts.project, fts.rank
    FROM sessions_fts fts
    WHERE sessions_fts MATCH ?
  `;
  const bindParams: unknown[] = [sanitizedQuery];

  if (params.project) {
    sql += ` AND fts.project = ?`;
    bindParams.push(params.project);
  }

  if (params.event_type) {
    sql += ` AND fts.event_type = ?`;
    bindParams.push(params.event_type);
  }

  sql += ` ORDER BY fts.rank LIMIT ?`;
  bindParams.push(params.limit);

  return db.prepare(sql).all(...bindParams) as Array<{
    event_id: string;
    session_id: string;
    event_type: string;
    project: string;
    rank: number;
  }>;
}

// --- Bulk insert (for import) ---

export function insertSessionBatch(
  db: Database.Database,
  session: {
    id: string;
    project: string;
    agent_source: string;
    title?: string;
    tags: string[];
    started_at: string;
    ended_at?: string;
    summaryEnc?: Buffer;
    summaryIv?: Buffer;
    summaryAuthTag?: Buffer;
  },
  events: Array<{
    id: string;
    sequence: number;
    event_type: string;
    timestamp: string;
    duration_ms?: number;
    contentEnc: Buffer;
    iv: Buffer;
    authTag: Buffer;
    metadata?: Record<string, unknown>;
    agent_source?: string;
    content: string; // plaintext for FTS
  }>,
): void {
  const now = new Date().toISOString();

  const insertSess = db.prepare(`
    INSERT INTO sessions (id, project, agent_source, title, summary_enc, summary_iv, summary_auth_tag,
      tags, event_count, started_at, ended_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEvent = db.prepare(`
    INSERT INTO session_events (id, session_id, sequence, event_type, timestamp, duration_ms,
      content_enc, iv, auth_tag, metadata, agent_source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFts = db.prepare(`
    INSERT INTO sessions_fts (event_id, session_id, content, event_type, project)
    VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertSess.run(
      session.id,
      session.project,
      session.agent_source,
      session.title ?? null,
      session.summaryEnc ?? null,
      session.summaryIv ?? null,
      session.summaryAuthTag ?? null,
      JSON.stringify(session.tags),
      events.length,
      session.started_at,
      session.ended_at ?? null,
      now,
      now,
    );

    for (const evt of events) {
      insertEvent.run(
        evt.id,
        session.id,
        evt.sequence,
        evt.event_type,
        evt.timestamp,
        evt.duration_ms ?? null,
        evt.contentEnc,
        evt.iv,
        evt.authTag,
        evt.metadata ? JSON.stringify(evt.metadata) : null,
        evt.agent_source ?? null,
        now,
      );
      insertFts.run(evt.id, session.id, evt.content, evt.event_type, session.project);
    }
  });

  transaction();
}

/**
 * Get a single session event by ID.
 */
export function getSessionEventById(
  db: Database.Database,
  id: string,
): SessionEventRow | undefined {
  return db
    .prepare(`SELECT * FROM session_events WHERE id = ?`)
    .get(id) as SessionEventRow | undefined;
}
