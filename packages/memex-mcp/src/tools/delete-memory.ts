import type Database from 'better-sqlite3';
import { softDeleteMemory } from '../db/queries.js';
import type { DeleteMemoryParams } from '../types.js';

/**
 * delete_memory MCP tool handler.
 *
 * Soft-deletes a memory by ID (sets deleted_at).
 */
export function handleDeleteMemory(
  db: Database.Database,
  params: DeleteMemoryParams,
): { deleted: boolean; id: string; error?: string } {
  const deleted = softDeleteMemory(db, params.id);

  if (!deleted) {
    return {
      deleted: false,
      id: params.id,
      error: 'Memory not found',
    };
  }

  return {
    deleted: true,
    id: params.id,
  };
}
