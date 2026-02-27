import crypto from 'node:crypto';

/**
 * SHA-256 content hashing for deduplication.
 * Returns hex-encoded hash string.
 */
export function hashContent(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext, 'utf8').digest('hex');
}
