import type Database from 'better-sqlite3';
import { resolveProject } from '../lib/project.js';
import { decryptContent } from '../crypto/encryption.js';
import { searchMemories, getMemoryCount } from '../db/queries.js';
import type { RecallMemoriesParams, Memory } from '../types.js';

/**
 * recall_memories MCP tool handler.
 *
 * Retrieves memories for the current project, optionally filtered by query/tags.
 * If query provided: FTS5 search within project.
 * If no query: recent memories for project.
 * Decrypts all results.
 */
export function handleRecallMemories(
  db: Database.Database,
  key: Buffer,
  params: RecallMemoriesParams,
): { memories: Memory[]; total: number; returned: number } {
  const project = resolveProject(params.project);
  const limit = params.limit ?? 10;

  const rows = searchMemories(db, {
    query: params.query,
    project,
    tags: params.tags,
    limit,
  });

  const memories: Memory[] = rows.map((row) => {
    const content = decryptContent(
      row.content_enc as unknown as Buffer,
      row.iv as unknown as Buffer,
      row.auth_tag as unknown as Buffer,
      key,
    );

    const memory: Memory = {
      id: row.id,
      project: row.project,
      content,
      tags: JSON.parse(row.tags as string) as string[],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    // Include relevance score if this was an FTS search
    if ('rank' in row && typeof row.rank === 'number') {
      memory.relevance = Math.abs(row.rank);
    }

    return memory;
  });

  const total = getMemoryCount(db, project);

  return {
    memories,
    total,
    returned: memories.length,
  };
}
