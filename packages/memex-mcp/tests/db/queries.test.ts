import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import { migrate } from '../../src/db/migrations.js';
import {
  insertMemory,
  findByHash,
  searchMemories,
  searchAllProjects,
  getRecentMemories,
  softDeleteMemory,
  purgeDeleted,
  getMemoryCount,
  getProjects,
  getAllMemories,
  updateMemoryEncryption,
} from '../../src/db/queries.js';
import { encryptContent, decryptContent } from '../../src/crypto/encryption.js';
import { hashContent } from '../../src/crypto/hash.js';
import { ulid } from '../../src/lib/ulid.js';

const key = crypto.randomBytes(32);

function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  migrate(db);
  return db;
}

function insertTestMemory(
  db: Database.Database,
  content: string,
  project = '/test/project',
  tags: string[] = [],
) {
  const { iv, ciphertext, authTag } = encryptContent(content, key);
  const id = ulid();
  insertMemory(db, {
    id,
    project,
    contentEnc: ciphertext,
    iv,
    authTag,
    tags,
    contentHash: hashContent(content),
    content,
  });
  return id;
}

describe('queries', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe('insertMemory + findByHash', () => {
    it('should insert a memory and find it by hash', () => {
      const content = 'Test memory content';
      const id = insertTestMemory(db, content);
      const hash = hashContent(content);
      const found = findByHash(db, hash, '/test/project');

      expect(found).toBeDefined();
      expect(found!.id).toBe(id);
      expect(found!.project).toBe('/test/project');
    });

    it('should not find by hash in different project', () => {
      insertTestMemory(db, 'Test content', '/project/a');
      const hash = hashContent('Test content');
      const found = findByHash(db, hash, '/project/b');
      expect(found).toBeUndefined();
    });
  });

  describe('searchMemories (FTS)', () => {
    it('should find memories by full-text search', () => {
      insertTestMemory(db, 'The authentication system uses JWT tokens');
      insertTestMemory(db, 'Database uses PostgreSQL with Prisma ORM');

      const results = searchMemories(db, {
        query: 'authentication JWT',
        project: '/test/project',
        limit: 10,
      });

      expect(results.length).toBe(1);
      // Decrypt to verify content
      const decrypted = decryptContent(
        results[0]!.content_enc as unknown as Buffer,
        results[0]!.iv as unknown as Buffer,
        results[0]!.auth_tag as unknown as Buffer,
        key,
      );
      expect(decrypted).toContain('authentication');
    });

    it('should return recent memories when no query', () => {
      insertTestMemory(db, 'First memory');
      insertTestMemory(db, 'Second memory');
      insertTestMemory(db, 'Third memory');

      const results = searchMemories(db, {
        project: '/test/project',
        limit: 2,
      });

      // Should return 2 most recent
      expect(results.length).toBe(2);
    });
  });

  describe('searchAllProjects', () => {
    it('should search across multiple projects', () => {
      insertTestMemory(db, 'Auth patterns for project A', '/project/a');
      insertTestMemory(db, 'Auth patterns for project B', '/project/b');
      insertTestMemory(db, 'Database schema for project A', '/project/a');

      const results = searchAllProjects(db, {
        query: 'Auth patterns',
        limit: 10,
      });

      expect(results.length).toBe(2);
    });
  });

  describe('tag filtering', () => {
    it('should filter by tags', () => {
      insertTestMemory(db, 'Auth memory', '/test/project', ['auth', 'security']);
      insertTestMemory(db, 'DB memory', '/test/project', ['database']);
      insertTestMemory(db, 'API memory', '/test/project', ['api', 'auth']);

      const results = getRecentMemories(db, {
        project: '/test/project',
        tags: ['auth'],
        limit: 10,
      });

      expect(results.length).toBe(2);
    });
  });

  describe('softDeleteMemory', () => {
    it('should soft-delete a memory', () => {
      const id = insertTestMemory(db, 'To be deleted');
      const deleted = softDeleteMemory(db, id);

      expect(deleted).toBe(true);
      expect(getMemoryCount(db)).toBe(0); // Soft-deleted should not count
    });

    it('should return false for non-existent ID', () => {
      const deleted = softDeleteMemory(db, 'nonexistent');
      expect(deleted).toBe(false);
    });

    it('should not return soft-deleted memories in queries', () => {
      const id = insertTestMemory(db, 'Deleted memory');
      insertTestMemory(db, 'Active memory');
      softDeleteMemory(db, id);

      const results = getRecentMemories(db, {
        project: '/test/project',
        limit: 10,
      });
      expect(results.length).toBe(1);
    });
  });

  describe('purgeDeleted', () => {
    it('should hard-delete soft-deleted memories', () => {
      const id1 = insertTestMemory(db, 'Deleted 1');
      const id2 = insertTestMemory(db, 'Deleted 2');
      insertTestMemory(db, 'Active');

      softDeleteMemory(db, id1);
      softDeleteMemory(db, id2);

      const purged = purgeDeleted(db);
      expect(purged).toBe(2);

      // Should still have 1 active memory
      expect(getMemoryCount(db)).toBe(1);
    });

    it('should return 0 when nothing to purge', () => {
      insertTestMemory(db, 'Active memory');
      expect(purgeDeleted(db)).toBe(0);
    });
  });

  describe('getMemoryCount', () => {
    it('should count all memories', () => {
      insertTestMemory(db, 'Memory 1');
      insertTestMemory(db, 'Memory 2');
      insertTestMemory(db, 'Memory 3');

      expect(getMemoryCount(db)).toBe(3);
    });

    it('should count by project', () => {
      insertTestMemory(db, 'A1', '/project/a');
      insertTestMemory(db, 'A2', '/project/a');
      insertTestMemory(db, 'B1', '/project/b');

      expect(getMemoryCount(db, '/project/a')).toBe(2);
      expect(getMemoryCount(db, '/project/b')).toBe(1);
    });
  });

  describe('getProjects', () => {
    it('should list projects with counts', () => {
      insertTestMemory(db, 'A1', '/project/a');
      insertTestMemory(db, 'A2', '/project/a');
      insertTestMemory(db, 'B1', '/project/b');

      const projects = getProjects(db);
      expect(projects.length).toBe(2);
      expect(projects[0]!.project).toBe('/project/a');
      expect(projects[0]!.count).toBe(2);
      expect(projects[1]!.project).toBe('/project/b');
      expect(projects[1]!.count).toBe(1);
    });
  });

  describe('getAllMemories', () => {
    it('should return all non-deleted memories', () => {
      insertTestMemory(db, 'M1', '/project/a');
      const deleted = insertTestMemory(db, 'M2', '/project/a');
      insertTestMemory(db, 'M3', '/project/b');

      softDeleteMemory(db, deleted);

      const all = getAllMemories(db);
      expect(all.length).toBe(2);
    });

    it('should filter by project', () => {
      insertTestMemory(db, 'M1', '/project/a');
      insertTestMemory(db, 'M2', '/project/b');

      const projectA = getAllMemories(db, '/project/a');
      expect(projectA.length).toBe(1);
    });
  });

  describe('updateMemoryEncryption (key rotation)', () => {
    it('should re-encrypt a memory with new key', () => {
      const content = 'Content to re-encrypt';
      const id = insertTestMemory(db, content);

      const newKey = crypto.randomBytes(32);
      const { iv, ciphertext, authTag } = encryptContent(content, newKey);
      updateMemoryEncryption(db, id, ciphertext, iv, authTag);

      const memories = getAllMemories(db);
      const mem = memories.find((m) => m.id === id)!;

      // Should decrypt with new key
      const decrypted = decryptContent(
        mem.content_enc as unknown as Buffer,
        mem.iv as unknown as Buffer,
        mem.auth_tag as unknown as Buffer,
        newKey,
      );
      expect(decrypted).toBe(content);

      // Should fail with old key
      expect(() =>
        decryptContent(
          mem.content_enc as unknown as Buffer,
          mem.iv as unknown as Buffer,
          mem.auth_tag as unknown as Buffer,
          key,
        ),
      ).toThrow();
    });
  });
});

describe('ulid', () => {
  it('should generate 26-character ULIDs', () => {
    const id = ulid();
    expect(id.length).toBe(26);
  });

  it('should be lexicographically sortable by time', async () => {
    const id1 = ulid();
    // Wait at least 1ms to guarantee a different timestamp
    await new Promise((resolve) => setTimeout(resolve, 2));
    const id2 = ulid();
    // The timestamp prefix (first 10 chars) of id2 should be >= id1
    expect(id2.slice(0, 10) >= id1.slice(0, 10)).toBe(true);
  });

  it('should use valid Crockford Base32 characters', () => {
    const id = ulid();
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('should generate unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(ulid());
    }
    expect(ids.size).toBe(100);
  });
});
