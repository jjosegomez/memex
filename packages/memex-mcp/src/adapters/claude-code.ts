import type { SessionAdapter, ParsedSession, ParsedSessionEvent } from './types.js';
import type { SessionEventTypeValue } from '../types.js';

interface ClaudeCodeRecord {
  type?: string;
  uuid?: string;
  parentUuid?: string;
  sessionId?: string;
  timestamp?: string;
  cwd?: string;
  version?: string;
  message?: {
    role?: string;
    content?: unknown;
    model?: string;
    usage?: Record<string, unknown>;
  };
}

interface ContentBlock {
  type?: string;
  text?: string;
  thinking?: string;
  name?: string;
  input?: unknown;
  id?: string;
}

/**
 * Parse a Claude Code native JSONL session transcript.
 *
 * Claude Code stores sessions at ~/.claude/projects/<project>/<session-id>.jsonl
 * Each line is a JSON object with type, message, timestamp, etc.
 */
export const parseClaudeCodeTranscript: SessionAdapter = (raw: string): ParsedSession => {
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('Empty Claude Code transcript');
  }

  const events: ParsedSessionEvent[] = [];
  let firstUserMessage: string | undefined;
  let sequence = 0;

  for (const line of lines) {
    let record: ClaudeCodeRecord;
    try {
      record = JSON.parse(line) as ClaudeCodeRecord;
    } catch {
      continue; // skip malformed lines
    }

    const recordType = record.type;
    if (!recordType || (recordType !== 'user' && recordType !== 'assistant')) {
      continue; // skip progress, file-history-snapshot, etc.
    }

    const timestamp = record.timestamp ?? new Date().toISOString();

    if (recordType === 'user') {
      const content = typeof record.message?.content === 'string'
        ? record.message.content
        : JSON.stringify(record.message?.content ?? '');

      if (!firstUserMessage && content.length > 0) {
        firstUserMessage = content;
      }

      events.push({
        sequence: sequence++,
        event_type: 'message_user' as SessionEventTypeValue,
        timestamp,
        content,
        metadata: {},
      });
      continue;
    }

    // Assistant messages — content is an array of blocks
    if (recordType === 'assistant') {
      const contentBlocks = record.message?.content;
      if (!Array.isArray(contentBlocks)) continue;

      const model = record.message?.model;

      for (const block of contentBlocks as ContentBlock[]) {
        if (!block || typeof block !== 'object') continue;

        if (block.type === 'text' && block.text) {
          events.push({
            sequence: sequence++,
            event_type: 'message_agent' as SessionEventTypeValue,
            timestamp,
            content: block.text,
            metadata: model ? { model } : undefined,
          });
        } else if (block.type === 'tool_use' && block.name) {
          const inputStr = block.input
            ? JSON.stringify(block.input).slice(0, 2000)
            : '';
          events.push({
            sequence: sequence++,
            event_type: 'tool_call' as SessionEventTypeValue,
            timestamp,
            content: `${block.name}: ${inputStr}`,
            metadata: {
              tool_name: block.name,
              ...(block.input ? { tool_input: block.input as Record<string, unknown> } : {}),
            },
          });
        }
        // Skip 'thinking' blocks — internal reasoning
      }
    }
  }

  if (events.length === 0) {
    throw new Error('No valid events found in Claude Code transcript');
  }

  const started_at = events[0]!.timestamp;
  const ended_at = events[events.length - 1]!.timestamp;
  const title = firstUserMessage
    ? firstUserMessage.slice(0, 100)
    : undefined;

  return {
    agent_source: 'claude-code',
    title,
    tags: ['imported', 'claude-code'],
    started_at,
    ended_at,
    events,
  };
};
