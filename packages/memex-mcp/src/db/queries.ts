import type Database from 'better-sqlite3';

/**
 * Sanitize a user query string for safe use in FTS5 MATCH.
 * Wraps each token in double quotes to prevent FTS5 syntax interpretation
 * of special characters like *, OR, NOT, NEAR, etc.
 */
function sanitizeFtsQuery(query: string): string {
  // Split on whitespace, wrap each non-empty token in double quotes,
  // escaping any embedded double quotes.
  return query
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token) => `"${token.replace(/"/g, '""')}"`)
    .join(' ');
}

/**
 * Row shape as stored in SQLite.
 */
interface MemoryRow {
  id: string;
  project: string;
  content_enc: Buffer;
  iv: Buffer;
  auth_tag: Buffer;
  tags: string;
  content_hash: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * FTS search result row with BM25 rank.
 */
interface FtsRow extends MemoryRow {
  rank: number;
}

/**
 * Insert a new memory and its FTS entry in a single transaction.
 *
 * The FTS table gets the plaintext content for search, while
 * the memories table gets the encrypted content.
 */
export function insertMemory(
  db: Database.Database,
  params: {
    id: string;
    project: string;
    contentEnc: Buffer;
    iv: Buffer;
    authTag: Buffer;
    tags: string[];
    contentHash: string;
    content: string; // plaintext for FTS
  },
): void {
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(params.tags);

  const insertMem = db.prepare(`
    INSERT INTO memories (id, project, content_enc, iv, auth_tag, tags, content_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFts = db.prepare(`
    INSERT INTO memories_fts (id, content, tags, project)
    VALUES (?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertMem.run(
      params.id,
      params.project,
      params.contentEnc,
      params.iv,
      params.authTag,
      tagsJson,
      params.contentHash,
      now,
      now,
    );
    insertFts.run(params.id, params.content, tagsJson, params.project);
  });

  transaction();
}

/**
 * Find a memory by content hash within a project (for dedup).
 */
export function findByHash(
  db: Database.Database,
  contentHash: string,
  project: string,
): MemoryRow | undefined {
  return db
    .prepare(
      `SELECT * FROM memories WHERE content_hash = ? AND project = ? AND deleted_at IS NULL`,
    )
    .get(contentHash, project) as MemoryRow | undefined;
}

/**
 * FTS5 BM25 search within a specific project.
 */
export function searchMemories(
  db: Database.Database,
  params: {
    query?: string;
    project?: string;
    tags?: string[];
    limit: number;
  },
): MemoryRow[] {
  if (!params.query) {
    return getRecentMemories(db, {
      project: params.project,
      tags: params.tags,
      limit: params.limit,
    });
  }

  // Build the query with optional filters
  const sanitizedQuery = sanitizeFtsQuery(params.query);
  let sql = `
    SELECT m.*, fts.rank
    FROM memories_fts fts
    JOIN memories m ON m.id = fts.id
    WHERE memories_fts MATCH ?
      AND m.deleted_at IS NULL
  `;
  const bindParams: unknown[] = [sanitizedQuery];

  if (params.project) {
    sql += ` AND m.project = ?`;
    bindParams.push(params.project);
  }

  if (params.tags && params.tags.length > 0) {
    sql += ` AND EXISTS (
      SELECT 1 FROM json_each(m.tags) je
      WHERE je.value IN (${params.tags.map(() => '?').join(',')})
    )`;
    bindParams.push(...params.tags);
  }

  sql += ` ORDER BY fts.rank LIMIT ?`;
  bindParams.push(params.limit);

  return db.prepare(sql).all(...bindParams) as FtsRow[];
}

/**
 * Cross-project FTS5 search (no project filter).
 */
export function searchAllProjects(
  db: Database.Database,
  params: {
    query: string;
    tags?: string[];
    limit: number;
  },
): MemoryRow[] {
  const sanitizedQuery = sanitizeFtsQuery(params.query);
  let sql = `
    SELECT m.*, fts.rank
    FROM memories_fts fts
    JOIN memories m ON m.id = fts.id
    WHERE memories_fts MATCH ?
      AND m.deleted_at IS NULL
  `;
  const bindParams: unknown[] = [sanitizedQuery];

  if (params.tags && params.tags.length > 0) {
    sql += ` AND EXISTS (
      SELECT 1 FROM json_each(m.tags) je
      WHERE je.value IN (${params.tags.map(() => '?').join(',')})
    )`;
    bindParams.push(...params.tags);
  }

  sql += ` ORDER BY fts.rank LIMIT ?`;
  bindParams.push(params.limit);

  return db.prepare(sql).all(...bindParams) as FtsRow[];
}

/**
 * Get recent memories (no query, just by recency).
 */
export function getRecentMemories(
  db: Database.Database,
  params: {
    project?: string;
    tags?: string[];
    limit: number;
  },
): MemoryRow[] {
  let sql = `SELECT * FROM memories WHERE deleted_at IS NULL`;
  const bindParams: unknown[] = [];

  if (params.project) {
    sql += ` AND project = ?`;
    bindParams.push(params.project);
  }

  if (params.tags && params.tags.length > 0) {
    sql += ` AND EXISTS (
      SELECT 1 FROM json_each(tags) je
      WHERE je.value IN (${params.tags.map(() => '?').join(',')})
    )`;
    bindParams.push(...params.tags);
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`;
  bindParams.push(params.limit);

  return db.prepare(sql).all(...bindParams) as MemoryRow[];
}

/**
 * Soft-delete a memory by ID (set deleted_at).
 */
export function softDeleteMemory(
  db: Database.Database,
  id: string,
): boolean {
  const now = new Date().toISOString();
  const result = db
    .prepare(`UPDATE memories SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`)
    .run(now, now, id);
  return result.changes > 0;
}

/**
 * Hard-delete all soft-deleted memories. Returns the count purged.
 */
export function purgeDeleted(db: Database.Database): number {
  // First remove from FTS
  const deletedIds = db
    .prepare(`SELECT id FROM memories WHERE deleted_at IS NOT NULL`)
    .all() as Array<{ id: string }>;

  if (deletedIds.length === 0) return 0;

  const deleteFts = db.prepare(`DELETE FROM memories_fts WHERE id = ?`);
  const deleteMemories = db.prepare(`DELETE FROM memories WHERE deleted_at IS NOT NULL`);

  const transaction = db.transaction(() => {
    for (const row of deletedIds) {
      deleteFts.run(row.id);
    }
    deleteMemories.run();
  });

  transaction();
  return deletedIds.length;
}

/**
 * Count memories, optionally filtered by project.
 */
export function getMemoryCount(
  db: Database.Database,
  project?: string,
): number {
  if (project) {
    const row = db
      .prepare(`SELECT COUNT(*) as count FROM memories WHERE project = ? AND deleted_at IS NULL`)
      .get(project) as { count: number };
    return row.count;
  }
  const row = db
    .prepare(`SELECT COUNT(*) as count FROM memories WHERE deleted_at IS NULL`)
    .get() as { count: number };
  return row.count;
}

/**
 * List distinct projects with their memory counts.
 */
export function getProjects(
  db: Database.Database,
): Array<{ project: string; count: number }> {
  return db
    .prepare(
      `SELECT project, COUNT(*) as count FROM memories WHERE deleted_at IS NULL GROUP BY project ORDER BY count DESC`,
    )
    .all() as Array<{ project: string; count: number }>;
}

/**
 * Get all memories (for export or key rotation).
 * Optionally filtered by project.
 */
export function getAllMemories(
  db: Database.Database,
  project?: string,
): MemoryRow[] {
  if (project) {
    return db
      .prepare(`SELECT * FROM memories WHERE project = ? AND deleted_at IS NULL ORDER BY created_at ASC`)
      .all(project) as MemoryRow[];
  }
  return db
    .prepare(`SELECT * FROM memories WHERE deleted_at IS NULL ORDER BY created_at ASC`)
    .all() as MemoryRow[];
}

/**
 * Update encrypted content for a memory (used during key rotation).
 */
export function updateMemoryEncryption(
  db: Database.Database,
  id: string,
  contentEnc: Buffer,
  iv: Buffer,
  authTag: Buffer,
): void {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE memories SET content_enc = ?, iv = ?, auth_tag = ?, updated_at = ? WHERE id = ?`,
  ).run(contentEnc, iv, authTag, now, id);
}
