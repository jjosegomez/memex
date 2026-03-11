import type { SessionAdapter, ParsedSession, ParsedSessionEvent } from './types.js';
import type { SessionEventTypeValue } from '../types.js';

const VALID_EVENT_TYPES = new Set([
  'tool_call', 'tool_result', 'message_user', 'message_agent',
  'error', 'warning', 'decision',
]);

/**
 * Parse a Memex universal JSONL session transcript.
 *
 * Format:
 *   # memex-session-v1 agent=claude-code started_at=2026-03-11T10:00:00Z
 *   {"event_type":"message_user","content":"...","timestamp":"...","sequence":0}
 *   ...
 */
export const parseJsonlTranscript: SessionAdapter = (raw: string): ParsedSession => {
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('Empty transcript file');
  }

  let agent_source = 'generic';
  let header_started_at: string | undefined;
  let dataStart = 0;

  // Parse optional header line
  const firstLine = lines[0]!;
  if (firstLine.startsWith('#')) {
    dataStart = 1;
    const agentMatch = firstLine.match(/agent=(\S+)/);
    if (agentMatch) agent_source = agentMatch[1]!;
    const startMatch = firstLine.match(/started_at=(\S+)/);
    if (startMatch) header_started_at = startMatch[1];
  }

  const events: ParsedSessionEvent[] = [];
  let skipped = 0;

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.startsWith('#')) continue;

    try {
      const parsed = JSON.parse(line) as Record<string, unknown>;

      const event_type = parsed['event_type'] as string;
      const content = parsed['content'] as string;
      const timestamp = parsed['timestamp'] as string;

      if (!event_type || !content || !timestamp) {
        skipped++;
        continue;
      }

      if (!VALID_EVENT_TYPES.has(event_type)) {
        skipped++;
        continue;
      }

      events.push({
        sequence: typeof parsed['sequence'] === 'number' ? parsed['sequence'] : events.length,
        event_type: event_type as SessionEventTypeValue,
        timestamp,
        duration_ms: typeof parsed['duration_ms'] === 'number' ? parsed['duration_ms'] : undefined,
        content,
        metadata: typeof parsed['metadata'] === 'object' && parsed['metadata'] !== null
          ? parsed['metadata'] as Record<string, unknown>
          : undefined,
      });
    } catch {
      skipped++;
    }
  }

  if (events.length === 0) {
    throw new Error(`No valid events found in transcript (${skipped} lines skipped)`);
  }

  // Sort by sequence
  events.sort((a, b) => a.sequence - b.sequence);

  const started_at = header_started_at ?? events[0]!.timestamp;
  const ended_at = events[events.length - 1]!.timestamp;

  return {
    agent_source,
    tags: ['imported'],
    started_at,
    ended_at,
    events,
  };
};
