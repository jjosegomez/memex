import type Database from 'better-sqlite3';
import { decryptContent } from '../crypto/encryption.js';
import { searchAllProjects, getMemoryCount } from '../db/queries.js';
import type { SearchMemoriesParams, Memory } from '../types.js';

/**
 * search_memories MCP tool handler.
 *
 * Cross-project FTS5 search.
 * Decrypts all results.
 */
export function handleSearchMemories(
  db: Database.Database,
  key: Buffer,
  params: SearchMemoriesParams,
): { memories: Memory[]; total: number; returned: number } {
  const limit = params.limit ?? 10;

  const rows = searchAllProjects(db, {
    query: params.query,
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

    if ('rank' in row && typeof row.rank === 'number') {
      memory.relevance = Math.abs(row.rank);
    }

    return memory;
  });

  const total = getMemoryCount(db);

  return {
    memories,
    total,
    returned: memories.length,
  };
}
