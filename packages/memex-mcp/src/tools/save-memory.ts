import type Database from 'better-sqlite3';
import { resolveProject } from '../lib/project.js';
import { ulid } from '../lib/ulid.js';
import { hashContent } from '../crypto/hash.js';
import { encryptContent } from '../crypto/encryption.js';
import { insertMemory, findByHash } from '../db/queries.js';
import type { SaveMemoryParams } from '../types.js';

/**
 * save_memory MCP tool handler.
 *
 * 1. Resolve project scope
 * 2. Hash content, check for duplicates
 * 3. Encrypt content
 * 4. Generate ULID
 * 5. Insert into DB (memories + FTS in one transaction)
 */
export function handleSaveMemory(
  db: Database.Database,
  key: Buffer,
  params: SaveMemoryParams,
): { id: string; project: string; tags: string[]; created_at: string; duplicate: boolean } {
  const project = resolveProject(params.project);
  const tags = params.tags ?? [];
  const contentHash = hashContent(params.content);

  // Dedup check
  const existing = findByHash(db, contentHash, project);
  if (existing) {
    return {
      id: existing.id,
      project: existing.project,
      tags: JSON.parse(existing.tags) as string[],
      created_at: existing.created_at,
      duplicate: true,
    };
  }

  // Encrypt
  const { iv, ciphertext, authTag } = encryptContent(params.content, key);

  // Generate ID
  const id = ulid();

  // Insert
  insertMemory(db, {
    id,
    project,
    contentEnc: ciphertext,
    iv,
    authTag,
    tags,
    contentHash,
    content: params.content,
  });

  return {
    id,
    project,
    tags,
    created_at: new Date().toISOString(),
    duplicate: false,
  };
}
