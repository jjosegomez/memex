import type { SessionEventTypeValue } from '../types.js';

/**
 * A parsed event ready for insertion.
 * Adapters produce these from raw agent transcripts.
 */
export interface ParsedSessionEvent {
  sequence: number;
  event_type: SessionEventTypeValue;
  timestamp: string;
  duration_ms?: number;
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * A parsed session with its events, ready for bulk insert.
 */
export interface ParsedSession {
  agent_source: string;
  title?: string;
  tags: string[];
  started_at: string;
  ended_at?: string;
  summary?: string;
  events: ParsedSessionEvent[];
}

/**
 * Adapter function signature.
 * Takes raw file content, returns a ParsedSession.
 * Throws on invalid/unparseable input.
 */
export type SessionAdapter = (raw: string) => ParsedSession;
