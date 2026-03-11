import { describe, it, expect } from 'vitest';
import { extractHeuristics } from '../../src/extraction/heuristics.js';
import type { SessionEvent } from '../../src/types.js';

function makeEvent(
  overrides: Partial<SessionEvent> & { event_type: SessionEvent['event_type'] },
): SessionEvent {
  return {
    id: 'test-id',
    session_id: 'test-session',
    sequence: 0,
    timestamp: '2026-03-11T10:00:00Z',
    duration_ms: null,
    content: '',
    metadata: null,
    agent_source: null,
    ...overrides,
  };
}

describe('extractHeuristics', () => {
  it('should count event types correctly', () => {
    const events: SessionEvent[] = [
      makeEvent({ event_type: 'message_user', content: 'Hello' }),
      makeEvent({ event_type: 'message_agent', content: 'Hi' }),
      makeEvent({ event_type: 'tool_call', content: 'Read file' }),
      makeEvent({ event_type: 'tool_call', content: 'Write file' }),
      makeEvent({ event_type: 'error', content: 'Something failed' }),
    ];

    const result = extractHeuristics(events);

    expect(result.metrics.user_messages).toBe(1);
    expect(result.metrics.agent_messages).toBe(1);
    expect(result.metrics.tool_calls).toBe(2);
    expect(result.metrics.errors).toBe(1);
    expect(result.metrics.total_events).toBe(5);
  });

  it('should extract tool names from metadata', () => {
    const events: SessionEvent[] = [
      makeEvent({
        event_type: 'tool_call',
        content: 'Read file',
        metadata: { tool_name: 'Read' },
      }),
      makeEvent({
        event_type: 'tool_call',
        content: 'Run command',
        metadata: { tool_name: 'Bash' },
      }),
    ];

    const result = extractHeuristics(events);
    expect(result.tools_used).toContain('Read');
    expect(result.tools_used).toContain('Bash');
  });

  it('should extract file paths from Write/Edit tool calls', () => {
    const events: SessionEvent[] = [
      makeEvent({
        event_type: 'tool_call',
        content: 'Write file',
        metadata: { tool_name: 'Write', tool_input: { file_path: '/src/app.ts' } },
      }),
      makeEvent({
        event_type: 'tool_call',
        content: 'Edit file',
        metadata: { tool_name: 'Edit', tool_input: { file_path: '/src/utils.ts' } },
      }),
      makeEvent({
        event_type: 'tool_call',
        content: 'Read file',
        metadata: { tool_name: 'Read', tool_input: { file_path: '/src/config.ts' } },
      }),
    ];

    const result = extractHeuristics(events);
    expect(result.files_changed).toContain('/src/app.ts');
    expect(result.files_changed).toContain('/src/utils.ts');
    // Read should NOT count as a file change
    expect(result.files_changed).not.toContain('/src/config.ts');
  });

  it('should detect build activity type', () => {
    const events: SessionEvent[] = [
      makeEvent({ event_type: 'message_user', content: 'Build a login page' }),
      makeEvent({
        event_type: 'tool_call',
        content: 'Write',
        metadata: { tool_name: 'Write', tool_input: { file_path: '/src/a.ts' } },
      }),
      makeEvent({
        event_type: 'tool_call',
        content: 'Write',
        metadata: { tool_name: 'Write', tool_input: { file_path: '/src/b.ts' } },
      }),
      makeEvent({
        event_type: 'tool_call',
        content: 'Write',
        metadata: { tool_name: 'Write', tool_input: { file_path: '/src/c.ts' } },
      }),
      makeEvent({
        event_type: 'tool_call',
        content: 'Write',
        metadata: { tool_name: 'Write', tool_input: { file_path: '/src/d.ts' } },
      }),
    ];

    const result = extractHeuristics(events);
    expect(result.activity_type).toBe('build');
  });

  it('should detect debug activity type when many errors', () => {
    const events: SessionEvent[] = [
      makeEvent({ event_type: 'message_user', content: 'Fix the bug' }),
      makeEvent({ event_type: 'error', content: 'TypeError: undefined' }),
      makeEvent({ event_type: 'error', content: 'Connection refused' }),
      makeEvent({ event_type: 'error', content: 'Timeout error' }),
      makeEvent({ event_type: 'error', content: 'Parse error' }),
    ];

    const result = extractHeuristics(events);
    expect(result.activity_type).toBe('debug');
  });

  it('should detect research activity type', () => {
    const events: SessionEvent[] = [
      makeEvent({ event_type: 'message_user', content: 'How does the auth work?' }),
      makeEvent({
        event_type: 'tool_call',
        content: 'Read',
        metadata: { tool_name: 'Read' },
      }),
      makeEvent({
        event_type: 'tool_call',
        content: 'Grep',
        metadata: { tool_name: 'Grep' },
      }),
      makeEvent({ event_type: 'message_agent', content: 'The auth uses JWT...' }),
    ];

    const result = extractHeuristics(events);
    expect(result.activity_type).toBe('research');
  });

  it('should detect discussion activity type (no tools)', () => {
    const events: SessionEvent[] = [
      makeEvent({ event_type: 'message_user', content: 'What should we build?' }),
      makeEvent({ event_type: 'message_agent', content: 'I think we should...' }),
      makeEvent({ event_type: 'message_user', content: 'What about X?' }),
      makeEvent({ event_type: 'message_agent', content: 'X is a good option...' }),
      makeEvent({ event_type: 'message_user', content: 'Let us go with X' }),
      makeEvent({ event_type: 'message_agent', content: 'Sounds good!' }),
    ];

    const result = extractHeuristics(events);
    expect(result.activity_type).toBe('discussion');
  });

  it('should detect refactor activity type', () => {
    const events: SessionEvent[] = [
      makeEvent({ event_type: 'message_user', content: 'Refactor the database module' }),
      makeEvent({ event_type: 'message_agent', content: 'I will restructure...' }),
    ];

    const result = extractHeuristics(events);
    expect(result.activity_type).toBe('refactor');
  });

  it('should calculate duration', () => {
    const events: SessionEvent[] = [
      makeEvent({ event_type: 'message_user', content: 'Start', timestamp: '2026-03-11T10:00:00Z' }),
      makeEvent({ event_type: 'message_agent', content: 'End', timestamp: '2026-03-11T10:30:00Z' }),
    ];

    const result = extractHeuristics(events);
    expect(result.duration_minutes).toBe(30);
  });

  it('should generate typescript tag for .ts files', () => {
    const events: SessionEvent[] = [
      makeEvent({
        event_type: 'tool_call',
        content: 'Write',
        metadata: { tool_name: 'Write', tool_input: { file_path: '/src/app.ts' } },
      }),
    ];

    const result = extractHeuristics(events);
    expect(result.suggested_tags).toContain('typescript');
  });

  it('should generate testing tag for test files', () => {
    const events: SessionEvent[] = [
      makeEvent({
        event_type: 'tool_call',
        content: 'Write',
        metadata: { tool_name: 'Write', tool_input: { file_path: '/tests/app.test.ts' } },
      }),
    ];

    const result = extractHeuristics(events);
    expect(result.suggested_tags).toContain('testing');
  });

  it('should collect errors (max 10)', () => {
    const events: SessionEvent[] = Array.from({ length: 15 }, (_, i) =>
      makeEvent({ event_type: 'error', content: `Error ${i}` }),
    );

    const result = extractHeuristics(events);
    expect(result.errors.length).toBe(10);
  });

  it('should handle empty events array', () => {
    const result = extractHeuristics([]);
    expect(result.metrics.total_events).toBe(0);
    expect(result.activity_type).toBe('general');
    expect(result.duration_minutes).toBeNull();
  });
});
