import { getDatabase, closeDatabase } from '../db/database.js';
import { getEncryptionKey } from '../crypto/keys.js';
import { decryptContent } from '../crypto/encryption.js';
import {
  searchMemories,
  searchAllProjects,
  getRecentMemories,
  softDeleteMemory,
  purgeDeleted,
  getMemoryCount,
} from '../db/queries.js';

/**
 * memex memories list — table format with ID, created_at, tags, content preview.
 */
export async function listMemories(opts: Record<string, string>): Promise<void> {
  const db = getDatabase();
  const key = getEncryptionKey();
  const limit = parseInt(opts['limit'] || '20', 10);

  const rows = getRecentMemories(db, {
    project: opts['project'],
    tags: opts['tag'] ? [opts['tag']] : undefined,
    limit,
  });

  if (rows.length === 0) {
    console.log('No memories found.');
    closeDatabase();
    return;
  }

  // Header
  const idW = 14;
  const dateW = 12;
  const tagsW = 20;
  const previewW = 50;
  console.log(
    `${'ID'.padEnd(idW)}  ${'Created'.padEnd(dateW)}  ${'Tags'.padEnd(tagsW)}  ${'Preview'.padEnd(previewW)}`,
  );
  console.log('-'.repeat(idW + dateW + tagsW + previewW + 6));

  for (const row of rows) {
    const content = decryptContent(
      row.content_enc as unknown as Buffer,
      row.iv as unknown as Buffer,
      row.auth_tag as unknown as Buffer,
      key,
    );
    const tags = JSON.parse(row.tags as string) as string[];
    const tagsStr = tags.join(',').slice(0, tagsW);
    const preview = content.replace(/\n/g, ' ').slice(0, previewW);

    // Format date as relative time
    const created = new Date(row.created_at);
    const dateStr = formatRelativeTime(created);

    console.log(
      `${row.id.slice(0, idW).padEnd(idW)}  ${dateStr.padEnd(dateW)}  ${tagsStr.padEnd(tagsW)}  ${preview}`,
    );
  }

  closeDatabase();
}

/**
 * memex memories search — FTS search across all projects.
 */
export async function searchMemories_cli(
  query: string,
  opts: Record<string, string>,
): Promise<void> {
  const db = getDatabase();
  const key = getEncryptionKey();
  const limit = parseInt(opts['limit'] || '10', 10);

  const rows = searchAllProjects(db, {
    query,
    limit,
  });

  if (rows.length === 0) {
    console.log('No results found.');
    closeDatabase();
    return;
  }

  console.log(`Found ${rows.length} results:\n`);

  for (const row of rows) {
    const content = decryptContent(
      row.content_enc as unknown as Buffer,
      row.iv as unknown as Buffer,
      row.auth_tag as unknown as Buffer,
      key,
    );
    const tags = JSON.parse(row.tags as string) as string[];
    const tagsStr = tags.join(',');
    const rank = 'rank' in row ? Math.abs(row.rank as number).toFixed(2) : '0.00';
    const preview = content.replace(/\n/g, ' ').slice(0, 60);
    const projectName = (row.project as string).split('/').pop() || row.project;

    console.log(
      `[${rank}] ${row.id.slice(0, 14)}  ${(projectName as string).padEnd(12)}  ${tagsStr.padEnd(20)}  ${preview}`,
    );
  }

  closeDatabase();
}

// Export with the name the CLI router expects
export { searchMemories_cli as searchMemories };

/**
 * memex memories delete — soft delete by ID.
 */
export async function deleteMemory(id: string): Promise<void> {
  const db = getDatabase();
  const deleted = softDeleteMemory(db, id);

  if (deleted) {
    console.log(`Memory ${id} deleted.`);
  } else {
    console.log(`Memory ${id} not found.`);
  }

  closeDatabase();
}

/**
 * memex memories purge — hard delete all soft-deleted.
 */
export async function purgeMemories(): Promise<void> {
  const db = getDatabase();
  const count = purgeDeleted(db);

  if (count > 0) {
    console.log(`${count} memories permanently deleted.`);
  } else {
    console.log('No soft-deleted memories to purge.');
  }

  closeDatabase();
}

/**
 * Format a date as relative time (e.g., "2h ago", "3d ago").
 */
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
