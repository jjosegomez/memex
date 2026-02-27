import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getKeyFilePath, getConfigDir } from '../lib/paths.js';
import { ensureDir } from '../lib/config.js';
import type { KeyMaterial } from '../types.js';

const VERIFICATION_STRING = 'memex-key-verification';

/**
 * Derive a 64-byte key from a passphrase using PBKDF2-SHA512.
 * Returns: first 32 bytes = AES key, last 32 bytes = HMAC key.
 */
export function deriveKey(
  passphrase: string,
  salt: Buffer,
  iterations: number,
): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, iterations, 64, 'sha512');
}

/**
 * Generate a random 32-byte AES key (for raw/no-passphrase mode).
 */
export function generateRawKey(): Buffer {
  return crypto.randomBytes(32);
}

/**
 * Create an HMAC verification tag from the HMAC portion of the derived key.
 */
function createVerificationTag(hmacKey: Buffer): string {
  return crypto
    .createHmac('sha256', hmacKey)
    .update(VERIFICATION_STRING)
    .digest('hex');
}

/**
 * Verify that a passphrase-derived key matches the stored verification tag.
 */
function verifyKey(hmacKey: Buffer, storedTag: string): boolean {
  const computed = createVerificationTag(hmacKey);
  return crypto.timingSafeEqual(
    Buffer.from(computed, 'hex'),
    Buffer.from(storedTag, 'hex'),
  );
}

/**
 * Save key material to the key file. Sets file permissions to 0o600.
 */
export function saveKeyMaterial(keyMaterial: KeyMaterial): void {
  const keyFilePath = getKeyFilePath();
  ensureDir(path.dirname(keyFilePath));
  fs.writeFileSync(keyFilePath, JSON.stringify(keyMaterial, null, 2) + '\n', 'utf8');
  fs.chmodSync(keyFilePath, 0o600);
}

/**
 * Load key material from the key file. Throws if not found.
 */
export function loadKeyMaterial(): KeyMaterial {
  const keyFilePath = getKeyFilePath();
  if (!fs.existsSync(keyFilePath)) {
    throw new Error(
      `Key file not found at ${keyFilePath}. Run 'memex init' first.`,
    );
  }
  const raw = fs.readFileSync(keyFilePath, 'utf8');
  return JSON.parse(raw) as KeyMaterial;
}

/**
 * Check if key material exists on disk.
 */
export function keyMaterialExists(): boolean {
  return fs.existsSync(getKeyFilePath());
}

/**
 * Initialize key material in passphrase mode.
 * Derives key from passphrase, stores salt + iterations + verification tag.
 */
export function initPassphraseKey(passphrase: string): void {
  const salt = crypto.randomBytes(32);
  const iterations = 100_000;
  const derived = deriveKey(passphrase, salt, iterations);
  const hmacKey = derived.subarray(32, 64);
  const verificationTag = createVerificationTag(hmacKey);

  const keyMaterial: KeyMaterial = {
    mode: 'passphrase',
    salt: salt.toString('hex'),
    iterations,
    verificationTag,
  };
  saveKeyMaterial(keyMaterial);
}

/**
 * Initialize key material in raw mode (no passphrase).
 * Generates a random 32-byte key and stores it directly.
 */
export function initRawKey(): void {
  const key = generateRawKey();
  const keyMaterial: KeyMaterial = {
    mode: 'raw',
    key: key.toString('hex'),
  };
  saveKeyMaterial(keyMaterial);
}

/**
 * Get the AES-256 encryption key.
 *
 * For raw mode: reads the key directly from the key file.
 * For passphrase mode: derives the key from the passphrase (env var or param).
 *
 * Throws if the passphrase is incorrect or key material is missing.
 */
export function getEncryptionKey(passphrase?: string): Buffer {
  const material = loadKeyMaterial();

  if (material.mode === 'raw') {
    if (!material.key) {
      throw new Error('Raw key material is missing the key field.');
    }
    return Buffer.from(material.key, 'hex');
  }

  // Passphrase mode
  const pass = passphrase || process.env['MEMEX_PASSPHRASE'];
  if (!pass) {
    throw new Error(
      'Passphrase required. Set MEMEX_PASSPHRASE environment variable or pass it directly.',
    );
  }

  if (!material.salt || !material.iterations || !material.verificationTag) {
    throw new Error('Passphrase key material is incomplete.');
  }

  const salt = Buffer.from(material.salt, 'hex');
  const derived = deriveKey(pass, salt, material.iterations);
  const aesKey = derived.subarray(0, 32);
  const hmacKey = derived.subarray(32, 64);

  if (!verifyKey(hmacKey, material.verificationTag)) {
    throw new Error('Incorrect passphrase. Key verification failed.');
  }

  return aesKey;
}
