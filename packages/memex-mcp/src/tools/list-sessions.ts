import type Database from 'better-sqlite3';
import { resolveProject } from '../lib/project.js';
import { decryptContent } from '../crypto/encryption.js';
import { listSessions, getSessionCount } from '../db/session-queries.js';
import type { ListSessionsParams, Session } from '../types.js';

export function handleListSessions(
  db: Database.Database,
  key: Buffer,
  params: ListSessionsParams,
): { sessions: Session[]; total: number; returned: number } {
  const project = params.project ?? resolveProject();

  const rows = listSessions(db, {
    project,
    agent_source: params.agent_source,
    tags: params.tags,
    status: params.status,
    limit: params.limit,
    offset: params.offset,
  });

  const sessions: Session[] = rows.map((row) => {
    let summary: string | null = null;
    if (row.summary_enc && row.summary_iv && row.summary_auth_tag) {
      summary = decryptContent(
        row.summary_enc as unknown as Buffer,
        row.summary_iv as unknown as Buffer,
        row.summary_auth_tag as unknown as Buffer,
        key,
      );
    }

    return {
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
  });

  const total = getSessionCount(db, project);

  return { sessions, total, returned: sessions.length };
}
