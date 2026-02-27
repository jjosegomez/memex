import { getDatabase, closeDatabase } from '../db/database.js';
import { getEncryptionKey } from '../crypto/keys.js';
import { decryptContent } from '../crypto/encryption.js';
import { getAllMemories } from '../db/queries.js';

/**
 * memex export — decrypt all memories and output as JSON array to stdout.
 */
export async function runExport(opts: Record<string, string>): Promise<void> {
  const db = getDatabase();
  const key = getEncryptionKey();

  const rows = getAllMemories(db, opts['project']);

  const memories = rows.map((row) => {
    const content = decryptContent(
      row.content_enc as unknown as Buffer,
      row.iv as unknown as Buffer,
      row.auth_tag as unknown as Buffer,
      key,
    );

    return {
      id: row.id,
      project: row.project,
      content,
      tags: JSON.parse(row.tags as string) as string[],
      content_hash: row.content_hash,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });

  // Output to stdout as JSON (for piping to file)
  console.log(JSON.stringify(memories, null, 2));

  closeDatabase();
}
