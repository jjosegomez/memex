import type Database from 'better-sqlite3';
import { decryptContent } from '../crypto/encryption.js';
import { getSessionById, getSessionEvents } from '../db/session-queries.js';
import { runExtraction } from '../extraction/pipeline.js';
import type { SessionEvent, SessionEventTypeValue } from '../types.js';

/**
 * extract_session MCP tool handler.
 *
 * Runs the hybrid extraction pipeline on a session:
 * 1. Heuristics (always, free)
 * 2. LLM extraction (if ANTHROPIC_API_KEY is set)
 * 3. Saves extracted memories + updates session summary
 */
export async function handleExtractSession(
  db: Database.Database,
  key: Buffer,
  params: { session_id: string },
): Promise<{
  session_id: string;
  activity_type: string;
  duration_minutes: number | null;
  files_changed: string[];
  tools_used: string[];
  memories_saved: number;
  memories_skipped: number;
  llm_used: boolean;
  summary: string | null;
  handoff: string | null;
}> {
  const session = getSessionById(db, params.session_id);
  if (!session) {
    throw new Error(`Session not found: ${params.session_id}`);
  }

  // Fetch all events and decrypt
  const eventRows = getSessionEvents(db, {
    session_id: params.session_id,
    limit: 1000,
    offset: 0,
  });

  const events: SessionEvent[] = eventRows.map((evt) => {
    const content = decryptContent(
      evt.content_enc as unknown as Buffer,
      evt.iv as unknown as Buffer,
      evt.auth_tag as unknown as Buffer,
      key,
    );

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

  const result = await runExtraction(db, key, params.session_id, session.project, events);

  return {
    session_id: params.session_id,
    activity_type: result.heuristics.activity_type,
    duration_minutes: result.heuristics.duration_minutes,
    files_changed: result.heuristics.files_changed,
    tools_used: result.heuristics.tools_used,
    memories_saved: result.memories_saved,
    memories_skipped: result.memories_skipped,
    llm_used: result.llm_used,
    summary: result.llm?.summary ?? null,
    handoff: result.llm?.handoff ?? null,
  };
}
