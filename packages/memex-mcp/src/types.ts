import { z } from 'zod';

export const SaveMemoryInput = z.object({
  content: z.string()
    .min(1)
    .max(50000)
    .describe('The content to remember. Can be code, context, decisions, patterns, or any text.'),
  tags: z.array(z.string().max(50))
    .max(20)
    .optional()
    .default([])
    .describe("Optional tags for categorization. E.g., ['architecture', 'auth', 'bug-fix']"),
  project: z.string()
    .optional()
    .describe('Project identifier. Defaults to git repo root or current working directory.'),
});

export const RecallMemoriesInput = z.object({
  query: z.string()
    .max(500)
    .optional()
    .describe('Search query. Uses full-text search with BM25 ranking. If omitted, returns recent memories.'),
  tags: z.array(z.string())
    .optional()
    .describe('Filter by tags. Returns memories matching ANY of the provided tags.'),
  project: z.string()
    .optional()
    .describe('Project identifier. Defaults to git repo root or current working directory.'),
  limit: z.number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Maximum number of memories to return.'),
});

export const SearchMemoriesInput = z.object({
  query: z.string()
    .min(1)
    .max(500)
    .describe('Search query. Uses full-text search across all projects.'),
  tags: z.array(z.string())
    .optional()
    .describe('Filter by tags.'),
  limit: z.number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Maximum number of memories to return.'),
});

export const DeleteMemoryInput = z.object({
  id: z.string()
    .describe('The memory ID (ULID) to delete.'),
});

export type SaveMemoryParams = z.infer<typeof SaveMemoryInput>;
export type RecallMemoriesParams = z.infer<typeof RecallMemoriesInput>;
export type SearchMemoriesParams = z.infer<typeof SearchMemoriesInput>;
export type DeleteMemoryParams = z.infer<typeof DeleteMemoryInput>;

export interface Memory {
  id: string;
  project: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  relevance?: number;
}

export interface KeyMaterial {
  mode: 'passphrase' | 'raw';
  salt?: string;
  iterations?: number;
  verificationTag?: string;
  key?: string;
}

// --- Session Recording (v2a) ---

export const SessionEventType = z.enum([
  'tool_call',
  'tool_result',
  'message_user',
  'message_agent',
  'error',
  'warning',
  'decision',
]);

export type SessionEventTypeValue = z.infer<typeof SessionEventType>;

export const StartSessionInput = z.object({
  project: z.string().optional()
    .describe('Project identifier. Defaults to git repo root or cwd.'),
  agent_source: z.string().default('generic')
    .describe("Agent identifier: 'claude-code', 'cursor', 'codex', 'generic'."),
  title: z.string().max(200).optional()
    .describe('Optional human-readable session title.'),
  tags: z.array(z.string().max(50)).max(20).optional().default([])
    .describe('Optional tags for categorization.'),
});

export const EndSessionInput = z.object({
  session_id: z.string()
    .describe('The session ID (ULID) to end.'),
  summary: z.string().max(50000).optional()
    .describe('Optional session summary text. Will be encrypted.'),
  tags: z.array(z.string().max(50)).max(20).optional()
    .describe('Optional tags to add/replace on the session.'),
});

export const RecordSessionEventInput = z.object({
  session_id: z.string()
    .describe('Session ID to record the event to.'),
  event_type: SessionEventType
    .describe('The type of event.'),
  content: z.string().max(200000)
    .describe('Event content — message text, tool input/output, error text, etc.'),
  metadata: z.record(z.unknown()).optional()
    .describe('Structured metadata specific to the event type.'),
  timestamp: z.string().datetime().optional()
    .describe('Event timestamp. Defaults to now if omitted.'),
  duration_ms: z.number().int().min(0).optional()
    .describe('Duration of the operation in ms.'),
});

export const ListSessionsInput = z.object({
  project: z.string().optional()
    .describe('Filter by project. Defaults to current project.'),
  agent_source: z.string().optional()
    .describe('Filter by agent source.'),
  tags: z.array(z.string()).optional()
    .describe('Filter by tags (ANY match).'),
  status: z.enum(['active', 'ended', 'all']).optional().default('all')
    .describe('Filter by session status.'),
  limit: z.number().int().min(1).max(100).optional().default(20)
    .describe('Maximum sessions to return.'),
  offset: z.number().int().min(0).optional().default(0)
    .describe('Pagination offset.'),
});

export const SearchSessionsInput = z.object({
  query: z.string().min(1).max(500)
    .describe('Full-text search query across session event content.'),
  project: z.string().optional()
    .describe('Filter by project.'),
  agent_source: z.string().optional()
    .describe('Filter by agent source.'),
  event_type: SessionEventType.optional()
    .describe('Filter to events of this type only.'),
  limit: z.number().int().min(1).max(50).optional().default(10)
    .describe('Maximum results to return.'),
});

export const GetSessionInput = z.object({
  session_id: z.string()
    .describe('The session ID to retrieve.'),
  event_types: z.array(SessionEventType).optional()
    .describe('Filter to specific event types. Returns all if omitted.'),
  limit: z.number().int().min(1).max(500).optional().default(100)
    .describe('Maximum events to return.'),
  offset: z.number().int().min(0).optional().default(0)
    .describe('Event pagination offset.'),
});

export type StartSessionParams = z.infer<typeof StartSessionInput>;
export type EndSessionParams = z.infer<typeof EndSessionInput>;
export type RecordSessionEventParams = z.infer<typeof RecordSessionEventInput>;
export type ListSessionsParams = z.infer<typeof ListSessionsInput>;
export type SearchSessionsParams = z.infer<typeof SearchSessionsInput>;
export type GetSessionParams = z.infer<typeof GetSessionInput>;

export interface Session {
  id: string;
  project: string;
  agent_source: string;
  title: string | null;
  summary: string | null;
  tags: string[];
  event_count: number;
  started_at: string;
  ended_at: string | null;
}

export interface SessionEvent {
  id: string;
  session_id: string;
  sequence: number;
  event_type: SessionEventTypeValue;
  timestamp: string;
  duration_ms: number | null;
  content: string;
  metadata: Record<string, unknown> | null;
  agent_source: string | null;
}

export interface SessionSearchResult {
  event_id: string;
  session_id: string;
  event_type: string;
  content_snippet: string;
  timestamp: string;
  session_title: string | null;
  project: string;
  relevance: number;
}
