import { describe, it, expect } from 'vitest';
import { parseJsonlTranscript } from '../../src/adapters/jsonl.js';
import { parseClaudeCodeTranscript } from '../../src/adapters/claude-code.js';

describe('jsonl adapter', () => {
  it('should parse a valid JSONL transcript with header', () => {
    const raw = [
      '# memex-session-v1 agent=claude-code started_at=2026-03-11T10:00:00Z',
      '{"event_type":"message_user","content":"Build a login page","timestamp":"2026-03-11T10:00:01Z","sequence":0}',
      '{"event_type":"message_agent","content":"I will create a login page.","timestamp":"2026-03-11T10:00:03Z","sequence":1}',
      '{"event_type":"tool_call","content":"Write src/login.tsx","timestamp":"2026-03-11T10:00:05Z","sequence":2,"metadata":{"tool_name":"Write"}}',
    ].join('\n');

    const result = parseJsonlTranscript(raw);

    expect(result.agent_source).toBe('claude-code');
    expect(result.started_at).toBe('2026-03-11T10:00:00Z');
    expect(result.ended_at).toBe('2026-03-11T10:00:05Z');
    expect(result.events.length).toBe(3);
    expect(result.events[0]!.event_type).toBe('message_user');
    expect(result.events[1]!.event_type).toBe('message_agent');
    expect(result.events[2]!.event_type).toBe('tool_call');
    expect(result.events[2]!.metadata).toEqual({ tool_name: 'Write' });
  });

  it('should parse without header line', () => {
    const raw = [
      '{"event_type":"message_user","content":"Hello","timestamp":"2026-03-11T10:00:00Z"}',
      '{"event_type":"message_agent","content":"Hi!","timestamp":"2026-03-11T10:00:01Z"}',
    ].join('\n');

    const result = parseJsonlTranscript(raw);
    expect(result.agent_source).toBe('generic');
    expect(result.events.length).toBe(2);
  });

  it('should skip malformed lines', () => {
    const raw = [
      '{"event_type":"message_user","content":"Valid","timestamp":"2026-03-11T10:00:00Z"}',
      'this is not json',
      '{"event_type":"message_agent","content":"Also valid","timestamp":"2026-03-11T10:00:01Z"}',
    ].join('\n');

    const result = parseJsonlTranscript(raw);
    expect(result.events.length).toBe(2);
  });

  it('should throw on empty file', () => {
    expect(() => parseJsonlTranscript('')).toThrow('Empty transcript');
  });

  it('should throw on all-invalid lines', () => {
    const raw = 'not json\nalso not json\n';
    expect(() => parseJsonlTranscript(raw)).toThrow('No valid events');
  });

  it('should skip events with invalid event_type', () => {
    const raw = [
      '{"event_type":"message_user","content":"Valid","timestamp":"2026-03-11T10:00:00Z"}',
      '{"event_type":"unknown_type","content":"Invalid type","timestamp":"2026-03-11T10:00:01Z"}',
    ].join('\n');

    const result = parseJsonlTranscript(raw);
    expect(result.events.length).toBe(1);
  });
});

describe('claude-code adapter', () => {
  it('should parse user and assistant messages', () => {
    const raw = [
      JSON.stringify({
        type: 'user',
        message: { role: 'user', content: 'Hello Claude' },
        timestamp: '2026-03-11T10:00:00Z',
        sessionId: 'test-session',
      }),
      JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello! How can I help?' }],
          model: 'claude-opus-4-6',
        },
        timestamp: '2026-03-11T10:00:02Z',
      }),
    ].join('\n');

    const result = parseClaudeCodeTranscript(raw);

    expect(result.agent_source).toBe('claude-code');
    expect(result.events.length).toBe(2);
    expect(result.events[0]!.event_type).toBe('message_user');
    expect(result.events[0]!.content).toBe('Hello Claude');
    expect(result.events[1]!.event_type).toBe('message_agent');
    expect(result.events[1]!.content).toBe('Hello! How can I help?');
    expect(result.events[1]!.metadata?.model).toBe('claude-opus-4-6');
    expect(result.title).toBe('Hello Claude');
    expect(result.tags).toContain('claude-code');
  });

  it('should parse tool_use blocks as tool_call events', () => {
    const raw = JSON.stringify({
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Let me read that file.' },
          { type: 'tool_use', name: 'Read', input: { file_path: '/test.ts' }, id: 'tool_1' },
        ],
        model: 'claude-opus-4-6',
      },
      timestamp: '2026-03-11T10:00:00Z',
    });

    const result = parseClaudeCodeTranscript(raw);

    expect(result.events.length).toBe(2);
    expect(result.events[0]!.event_type).toBe('message_agent');
    expect(result.events[1]!.event_type).toBe('tool_call');
    expect(result.events[1]!.metadata?.tool_name).toBe('Read');
  });

  it('should skip thinking blocks', () => {
    const raw = JSON.stringify({
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: 'Let me think about this...' },
          { type: 'text', text: 'Here is my answer.' },
        ],
      },
      timestamp: '2026-03-11T10:00:00Z',
    });

    const result = parseClaudeCodeTranscript(raw);

    expect(result.events.length).toBe(1);
    expect(result.events[0]!.event_type).toBe('message_agent');
  });

  it('should skip file-history-snapshot and progress types', () => {
    const raw = [
      JSON.stringify({ type: 'file-history-snapshot', snapshot: {} }),
      JSON.stringify({ type: 'progress', data: {} }),
      JSON.stringify({
        type: 'user',
        message: { role: 'user', content: 'Hello' },
        timestamp: '2026-03-11T10:00:00Z',
      }),
    ].join('\n');

    const result = parseClaudeCodeTranscript(raw);
    expect(result.events.length).toBe(1);
    expect(result.events[0]!.event_type).toBe('message_user');
  });

  it('should throw on empty transcript', () => {
    expect(() => parseClaudeCodeTranscript('')).toThrow('Empty');
  });

  it('should throw when no valid events', () => {
    const raw = [
      JSON.stringify({ type: 'file-history-snapshot', snapshot: {} }),
      JSON.stringify({ type: 'progress', data: {} }),
    ].join('\n');

    expect(() => parseClaudeCodeTranscript(raw)).toThrow('No valid events');
  });

  it('should truncate long titles', () => {
    const longMessage = 'A'.repeat(200);
    const raw = JSON.stringify({
      type: 'user',
      message: { role: 'user', content: longMessage },
      timestamp: '2026-03-11T10:00:00Z',
    });

    const result = parseClaudeCodeTranscript(raw);
    expect(result.title!.length).toBe(100);
  });

  it('should assign sequential sequence numbers', () => {
    const raw = [
      JSON.stringify({
        type: 'user',
        message: { role: 'user', content: 'First' },
        timestamp: '2026-03-11T10:00:00Z',
      }),
      JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Response' },
            { type: 'tool_use', name: 'Bash', input: { command: 'ls' } },
          ],
        },
        timestamp: '2026-03-11T10:00:02Z',
      }),
      JSON.stringify({
        type: 'user',
        message: { role: 'user', content: 'Thanks' },
        timestamp: '2026-03-11T10:00:05Z',
      }),
    ].join('\n');

    const result = parseClaudeCodeTranscript(raw);
    expect(result.events.map((e) => e.sequence)).toEqual([0, 1, 2, 3]);
  });
});
