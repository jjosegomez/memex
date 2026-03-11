import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type Database from 'better-sqlite3';
import { parseClaudeCodeTranscript } from '../adapters/claude-code.js';
import { encryptContent } from '../crypto/encryption.js';
import { ulid } from '../lib/ulid.js';
import { insertSessionBatch, getSessionById } from '../db/session-queries.js';
import { hashContent } from '../crypto/hash.js';

/**
 * Result of an ingest operation.
 */
export interface IngestResult {
  /** Total session files found */
  found: number;
  /** Sessions successfully imported */
  imported: number;
  /** Sessions skipped (already imported) */
  skipped: number;
  /** Sessions that failed to parse */
  failed: number;
  /** Details of each imported session */
  sessions: Array<{
    file: string;
    session_id: string;
    events: number;
  }>;
  /** Errors encountered */
  errors: Array<{
    file: string;
    error: string;
  }>;
}

/**
 * Known agent session locations.
 * Each entry describes where an agent stores its session transcripts.
 */
interface AgentSource {
  name: string;
  /** Function to find session files for this agent */
  findSessionFiles: () => string[];
  /** Adapter name to use for parsing */
  adapter: 'claude-code' | 'generic';
}

/**
 * Get Claude Code session directory for a given project path.
 * Claude Code encodes project paths by replacing / with -
 */
function getClaudeCodeProjectDirs(): string[] {
  const claudeDir = path.join(os.homedir(), '.claude', 'projects');
  if (!fs.existsSync(claudeDir)) return [];

  try {
    return fs.readdirSync(claudeDir)
      .map((dir) => path.join(claudeDir, dir))
      .filter((p) => fs.statSync(p).isDirectory());
  } catch {
    return [];
  }
}

/**
 * Find all Claude Code session JSONL files.
 */
function findClaudeCodeSessions(): string[] {
  const projectDirs = getClaudeCodeProjectDirs();
  const files: string[] = [];

  for (const dir of projectDirs) {
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        // Session files are UUID.jsonl at the top level of project dirs
        if (entry.endsWith('.jsonl') && /^[0-9a-f]{8}-/.test(entry)) {
          files.push(path.join(dir, entry));
        }
      }
    } catch {
      // Skip unreadable directories
    }
  }

  return files;
}

/**
 * Generate a stable hash for a session file to detect duplicates.
 * Uses the file path (which includes the session UUID) as a stable key.
 * This ensures active sessions aren't re-imported as they grow.
 */
function sessionFileHash(filePath: string): string {
  return hashContent(filePath);
}

/**
 * Resolve the project path from a Claude Code project directory name.
 * Claude Code encodes paths: /Users/juan/code → -Users-juan-code
 */
function resolveProjectFromClaudeDir(dirName: string): string {
  // Replace leading dash and convert dashes back to slashes
  return dirName.replace(/^-/, '/').replace(/-/g, '/');
}

const AGENT_SOURCES: AgentSource[] = [
  {
    name: 'claude-code',
    findSessionFiles: findClaudeCodeSessions,
    adapter: 'claude-code',
  },
  // Future: add cursor, codex, aider, etc.
];

/**
 * Ingest all sessions from all known agent sources.
 *
 * Uses a tracking table (meta) to avoid re-importing sessions.
 * The key is a hash of the file path + size + mtime.
 */
export function ingestSessions(
  db: Database.Database,
  key: Buffer,
  opts?: {
    /** Only ingest from this agent */
    agent?: string;
    /** Only ingest from this project */
    project?: string;
    /** Dry run — don't actually import */
    dry_run?: boolean;
  },
): IngestResult {
  const result: IngestResult = {
    found: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    sessions: [],
    errors: [],
  };

  // Ensure the ingested_sessions tracking table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingested_sessions (
      file_hash TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      session_id TEXT NOT NULL,
      ingested_at TEXT NOT NULL
    )
  `);

  const sources = opts?.agent
    ? AGENT_SOURCES.filter((s) => s.name === opts.agent)
    : AGENT_SOURCES;

  for (const source of sources) {
    const files = source.findSessionFiles();

    for (const filePath of files) {
      result.found++;

      // Project filter
      if (opts?.project) {
        const dirName = path.basename(path.dirname(filePath));
        const project = resolveProjectFromClaudeDir(dirName);
        if (!project.includes(opts.project)) continue;
      }

      // Check if already ingested
      const fileHash = sessionFileHash(filePath);
      const existing = db
        .prepare('SELECT session_id FROM ingested_sessions WHERE file_hash = ?')
        .get(fileHash) as { session_id: string } | undefined;

      if (existing) {
        result.skipped++;
        continue;
      }

      if (opts?.dry_run) {
        result.imported++;
        result.sessions.push({ file: filePath, session_id: '(dry run)', events: 0 });
        continue;
      }

      // Parse and import
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        if (raw.trim().length === 0) {
          result.skipped++;
          continue;
        }

        const parsed = parseClaudeCodeTranscript(raw);

        // Resolve project from directory
        const dirName = path.basename(path.dirname(filePath));
        const project = resolveProjectFromClaudeDir(dirName);

        const sessionId = ulid();

        const encryptedEvents = parsed.events.map((evt) => {
          const { iv, ciphertext, authTag } = encryptContent(evt.content, key);
          return {
            id: ulid(),
            sequence: evt.sequence,
            event_type: evt.event_type,
            timestamp: evt.timestamp,
            duration_ms: evt.duration_ms,
            contentEnc: ciphertext,
            iv,
            authTag,
            metadata: evt.metadata,
            agent_source: parsed.agent_source,
            content: evt.content,
          };
        });

        insertSessionBatch(
          db,
          {
            id: sessionId,
            project,
            agent_source: parsed.agent_source,
            title: parsed.title,
            tags: [...parsed.tags, 'auto-ingested'],
            started_at: parsed.started_at,
            ended_at: parsed.ended_at,
          },
          encryptedEvents,
        );

        // Track ingestion
        db.prepare(
          'INSERT INTO ingested_sessions (file_hash, file_path, session_id, ingested_at) VALUES (?, ?, ?, ?)',
        ).run(fileHash, filePath, sessionId, new Date().toISOString());

        result.imported++;
        result.sessions.push({ file: filePath, session_id: sessionId, events: parsed.events.length });
      } catch (err) {
        result.failed++;
        result.errors.push({
          file: filePath,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return result;
}
