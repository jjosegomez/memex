import crypto from 'node:crypto';

/**
 * AES-256-GCM encryption.
 * Each call generates a fresh random 12-byte IV. NEVER reuse IVs.
 */
export function encryptContent(
  plaintext: string,
  key: Buffer,
): { iv: Buffer; ciphertext: Buffer; authTag: Buffer } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return {
    iv,
    ciphertext: encrypted,
    authTag: cipher.getAuthTag(),
  };
}

/**
 * AES-256-GCM decryption.
 * Returns the original plaintext string.
 */
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
