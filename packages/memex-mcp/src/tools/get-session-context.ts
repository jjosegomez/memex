import type Database from 'better-sqlite3';
import { resolveProject } from '../lib/project.js';
import { decryptContent } from '../crypto/encryption.js';
import { listSessions, getSessionEvents } from '../db/session-queries.js';
import { searchMemories } from '../db/queries.js';
import { extractHeuristics } from '../extraction/heuristics.js';
import type { SessionEventTypeValue } from '../types.js';

/**
 * Context packet returned to an agent at session start.
 * Contains everything the agent needs to pick up where the last session left off.
 */
export interface SessionContext {
  /** Project identifier */
  project: string;
  /** Summary of recent sessions */
  recent_sessions: Array<{
    id: string;
    title: string | null;
    agent_source: string;
    summary: string | null;
    activity_type: string;
    started_at: string;
    ended_at: string | null;
    files_changed: string[];
  }>;
  /** Handoff note from the most recent session (if available) */
  last_handoff: string | null;
  /** Files recently touched across sessions */
  recently_modified_files: string[];
  /** Active context from recent memories */
  relevant_memories: Array<{
    content: string;
    tags: string[];
  }>;
}

/**
 * get_session_context MCP tool handler.
 *
 * Builds a smart context packet for the current project by aggregating:
 * 1. Recent session summaries (last 5)
 * 2. Handoff notes from the most recent session
 * 3. Files recently touched
 * 4. Relevant memories
 */
export function handleGetSessionContext(
  db: Database.Database,
  key: Buffer,
  params: { project?: string; limit?: number },
): SessionContext {
  const project = resolveProject(params.project);
  const sessionLimit = params.limit ?? 5;

  // Get recent sessions for this project
  const sessionRows = listSessions(db, {
    project,
    status: 'all',
    limit: sessionLimit,
    offset: 0,
  });

  const recentSessions: SessionContext['recent_sessions'] = [];
  const allFilesChanged = new Set<string>();
  let lastHandoff: string | null = null;

  for (const row of sessionRows) {
    // Decrypt summary if present
    let summary: string | null = null;
    if (row.summary_enc && row.summary_iv && row.summary_auth_tag) {
      try {
        summary = decryptContent(
          row.summary_enc as unknown as Buffer,
          row.summary_iv as unknown as Buffer,
          row.summary_auth_tag as unknown as Buffer,
          key,
        );
      } catch {
        // Skip if decryption fails
      }
    }

    // Get events to run heuristics for activity type and files
    const eventRows = getSessionEvents(db, {
      session_id: row.id,
      limit: 500,
      offset: 0,
    });

    const events = eventRows.map((evt) => {
      let content = '';
      try {
        content = decryptContent(
          evt.content_enc as unknown as Buffer,
          evt.iv as unknown as Buffer,
          evt.auth_tag as unknown as Buffer,
          key,
        );
      } catch {
        // Skip unreadable events
      }
      return {
        id: evt.id,
        session_id: evt.session_id,
        sequence: evt.sequence,
        event_type: evt.event_type as SessionEventTypeValue,
        timestamp: evt.timestamp,
        duration_ms: evt.duration_ms,
        content,
        metadata: evt.metadata ? JSON.parse(evt.metadata) as Record<string, unknown> : null,
        agent_source: evt.agent_source,
      };
    });

    const heuristics = extractHeuristics(events);

    // Track files
    for (const f of heuristics.files_changed) {
      allFilesChanged.add(f);
    }

    // Extract handoff from the most recent session's summary
    if (!lastHandoff && summary) {
      // Check if summary contains handoff-like content
      lastHandoff = summary;
    }

    recentSessions.push({
      id: row.id,
      title: row.title,
      agent_source: row.agent_source,
      summary,
      activity_type: heuristics.activity_type,
      started_at: row.started_at,
      ended_at: row.ended_at,
      files_changed: heuristics.files_changed,
    });
  }

  // Get relevant recent memories for this project
  const memoryRows = searchMemories(db, {
    project,
    limit: 5,
  });

  const relevantMemories = memoryRows.map((row) => {
    const content = decryptContent(
      row.content_enc as unknown as Buffer,
      row.iv as unknown as Buffer,
      row.auth_tag as unknown as Buffer,
      key,
    );
    return {
      content,
      tags: JSON.parse(row.tags as string) as string[],
    };
  });

  return {
    project,
    recent_sessions: recentSessions,
    last_handoff: lastHandoff,
    recently_modified_files: [...allFilesChanged],
    relevant_memories: relevantMemories,
  };
}
