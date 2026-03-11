import type Database from 'better-sqlite3';
import { encryptContent } from '../crypto/encryption.js';
import { getSessionById, updateSessionEnd, getEventCount } from '../db/session-queries.js';
import type { EndSessionParams } from '../types.js';

export function handleEndSession(
  db: Database.Database,
  key: Buffer,
  params: EndSessionParams,
): { session_id: string; ended_at: string; event_count: number } {
  const session = getSessionById(db, params.session_id);
  if (!session) {
    throw new Error(`Session not found: ${params.session_id}`);
  }
  if (session.ended_at) {
    throw new Error(`Session already ended: ${params.session_id}`);
  }

  const ended_at = new Date().toISOString();
  const event_count = getEventCount(db, params.session_id);

  let summaryEnc: Buffer | undefined;
  let summaryIv: Buffer | undefined;
  let summaryAuthTag: Buffer | undefined;

  if (params.summary) {
    const encrypted = encryptContent(params.summary, key);
    summaryEnc = encrypted.ciphertext;
    summaryIv = encrypted.iv;
    summaryAuthTag = encrypted.authTag;
  }

  updateSessionEnd(db, {
    id: params.session_id,
    summaryEnc,
    summaryIv,
    summaryAuthTag,
    tags: params.tags,
    ended_at,
    event_count,
  });

  return { session_id: params.session_id, ended_at, event_count };
}
