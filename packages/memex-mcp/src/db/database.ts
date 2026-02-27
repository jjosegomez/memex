import Database from 'better-sqlite3';
import { getDbPath } from '../lib/paths.js';
import { ensureDir } from '../lib/config.js';
import { migrate } from './migrations.js';
import path from 'node:path';

let _db: Database.Database | null = null;

/**
 * Get the singleton database connection.
 * Auto-runs migrations on first connect.
 * Uses WAL mode for better concurrent access.
 */
export function getDatabase(dbPath?: string): Database.Database {
  if (_db) return _db;

  const resolvedPath = dbPath || getDbPath();
  ensureDir(path.dirname(resolvedPath));

  _db = new Database(resolvedPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  migrate(_db);

  return _db;
}

/**
 * Close the database connection and reset the singleton.
 * Useful for tests and cleanup.
 */
export function closeDatabase(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

/**
 * Create an in-memory database for testing.
 * Not a singleton — each call returns a fresh connection.
 */
export function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}
