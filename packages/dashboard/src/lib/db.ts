import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';

// --- Path resolution (mirrors memex-mcp/src/lib/paths.ts) ---

function getConfigDir(): string {
  const xdgConfig = process.env['XDG_CONFIG_HOME'];
  const base = xdgConfig || path.join(os.homedir(), '.config');
  return path.join(base, 'memex');
}

function getDataDir(): string {
  const xdgData = process.env['XDG_DATA_HOME'];
  const base = xdgData || path.join(os.homedir(), '.local', 'share');
  return path.join(base, 'memex');
}

function getKeyFilePath(): string {
  return path.join(getConfigDir(), 'key.enc');
}

function getDbPath(): string {
  return path.join(getDataDir(), 'memex.db');
}

// --- Key loading (mirrors memex-mcp/src/crypto/keys.ts) ---

interface KeyMaterial {
  mode: 'passphrase' | 'raw';
  salt?: string;
  iterations?: number;
  verificationTag?: string;
  key?: string;
}

function loadEncryptionKey(): Buffer {
  const keyFilePath = getKeyFilePath();
  if (!fs.existsSync(keyFilePath)) {
    throw new Error(`Key file not found at ${keyFilePath}. Run 'memex init' first.`);
  }
  const material = JSON.parse(fs.readFileSync(keyFilePath, 'utf8')) as KeyMaterial;

  if (material.mode === 'raw') {
    if (!material.key) throw new Error('Raw key material is missing the key field.');
    return Buffer.from(material.key, 'hex');
  }

  const pass = process.env['MEMEX_PASSPHRASE'];
  if (!pass) {
    throw new Error('Passphrase required. Set MEMEX_PASSPHRASE environment variable.');
  }
  if (!material.salt || !material.iterations) {
    throw new Error('Passphrase key material is incomplete.');
  }

  const salt = Buffer.from(material.salt, 'hex');
  const derived = crypto.pbkdf2Sync(pass, salt, material.iterations, 64, 'sha512');
  return derived.subarray(0, 32);
}

// --- Decryption (mirrors memex-mcp/src/crypto/encryption.ts) ---

export function decryptContent(
  ciphertext: Buffer,
  iv: Buffer,
  authTag: Buffer,
  key: Buffer,
): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
}

// --- Singleton DB + key ---

let _db: Database.Database | null = null;
let _key: Buffer | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Memex database not found at ${dbPath}. Run 'memex init' first.`);
  }
  _db = new Database(dbPath, { readonly: true });
  _db.pragma('journal_mode = WAL');
  return _db;
}

export function getKey(): Buffer {
  if (_key) return _key;
  _key = loadEncryptionKey();
  return _key;
}
