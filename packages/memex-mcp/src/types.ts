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
