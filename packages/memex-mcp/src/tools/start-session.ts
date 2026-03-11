import type Database from 'better-sqlite3';
import { resolveProject } from '../lib/project.js';
import { ulid } from '../lib/ulid.js';
import { insertSession } from '../db/session-queries.js';
import type { StartSessionParams } from '../types.js';

export function handleStartSession(
  db: Database.Database,
  _key: Buffer,
  params: StartSessionParams,
): { session_id: string; project: string; started_at: string } {
  const project = resolveProject(params.project);
  const session_id = ulid();
  const started_at = new Date().toISOString();
  const tags = params.tags ?? [];

  insertSession(db, {
    id: session_id,
    project,
    agent_source: params.agent_source,
    title: params.title,
    tags,
    started_at,
  });

  return { session_id, project, started_at };
}
