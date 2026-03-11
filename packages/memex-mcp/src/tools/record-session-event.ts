import type Database from 'better-sqlite3';
import { ulid } from '../lib/ulid.js';
import { encryptContent } from '../crypto/encryption.js';
import { getSessionById, getNextSequence, insertSessionEvent } from '../db/session-queries.js';
import type { RecordSessionEventParams } from '../types.js';

export function handleRecordSessionEvent(
  db: Database.Database,
  key: Buffer,
  params: RecordSessionEventParams,
): { event_id: string; session_id: string; sequence: number } {
  const session = getSessionById(db, params.session_id);
  if (!session) {
    throw new Error(`Session not found: ${params.session_id}`);
  }

  const event_id = ulid();
  const sequence = getNextSequence(db, params.session_id);
  const timestamp = params.timestamp ?? new Date().toISOString();
  const { iv, ciphertext, authTag } = encryptContent(params.content, key);

  insertSessionEvent(db, {
    id: event_id,
    session_id: params.session_id,
    sequence,
    event_type: params.event_type,
    timestamp,
    duration_ms: params.duration_ms,
    contentEnc: ciphertext,
    iv,
    authTag,
    metadata: params.metadata,
    agent_source: session.agent_source,
    content: params.content,
    project: session.project,
  });

  return { event_id, session_id: params.session_id, sequence };
}
