import type Database from 'better-sqlite3';
import { decryptContent } from '../crypto/encryption.js';
import {
  searchSessionContent,
  getSessionEventById,
  getSessionById,
} from '../db/session-queries.js';
import type { SearchSessionsParams, SessionSearchResult } from '../types.js';

export function handleSearchSessions(
  db: Database.Database,
  key: Buffer,
  params: SearchSessionsParams,
): { results: SessionSearchResult[]; returned: number } {
  const ftsResults = searchSessionContent(db, {
    query: params.query,
    project: params.project,
    agent_source: params.agent_source,
    event_type: params.event_type,
    limit: params.limit,
  });

  const results: SessionSearchResult[] = [];

  for (const hit of ftsResults) {
    const eventRow = getSessionEventById(db, hit.event_id);
    if (!eventRow) continue;

    const content = decryptContent(
      eventRow.content_enc as unknown as Buffer,
      eventRow.iv as unknown as Buffer,
      eventRow.auth_tag as unknown as Buffer,
      key,
    );

    const session = getSessionById(db, hit.session_id);

    results.push({
      event_id: hit.event_id,
      session_id: hit.session_id,
      event_type: hit.event_type,
      content_snippet: content.slice(0, 200),
      timestamp: eventRow.timestamp,
      session_title: session?.title ?? null,
      project: hit.project,
      relevance: Math.abs(hit.rank),
    });
  }

  return { results, returned: results.length };
}
