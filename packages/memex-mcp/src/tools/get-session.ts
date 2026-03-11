import type Database from 'better-sqlite3';
import { decryptContent } from '../crypto/encryption.js';
import { getSessionById, getSessionEvents, getEventCount } from '../db/session-queries.js';
import type { GetSessionParams, Session, SessionEvent, SessionEventTypeValue } from '../types.js';

export function handleGetSession(
  db: Database.Database,
  key: Buffer,
  params: GetSessionParams,
): { session: Session; events: SessionEvent[]; total_events: number } {
  const row = getSessionById(db, params.session_id);
  if (!row) {
    throw new Error(`Session not found: ${params.session_id}`);
  }

  let summary: string | null = null;
  if (row.summary_enc && row.summary_iv && row.summary_auth_tag) {
    summary = decryptContent(
      row.summary_enc as unknown as Buffer,
      row.summary_iv as unknown as Buffer,
      row.summary_auth_tag as unknown as Buffer,
      key,
    );
  }

  const session: Session = {
    id: row.id,
    project: row.project,
    agent_source: row.agent_source,
    title: row.title,
    summary,
    tags: JSON.parse(row.tags) as string[],
    event_count: row.event_count,
    started_at: row.started_at,
    ended_at: row.ended_at,
  };

  const eventRows = getSessionEvents(db, {
    session_id: params.session_id,
    event_types: params.event_types,
    limit: params.limit,
    offset: params.offset,
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

  const total_events = getEventCount(db, params.session_id);

  return { session, events, total_events };
}
