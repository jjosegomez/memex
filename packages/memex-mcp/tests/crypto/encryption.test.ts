import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { encryptContent, decryptContent } from '../../src/crypto/encryption.js';
import { hashContent } from '../../src/crypto/hash.js';

describe('encryption', () => {
  const key = crypto.randomBytes(32);

  it('should round-trip encrypt and decrypt content', () => {
    const plaintext = 'Hello, Memex! This is a test memory.';
    const { iv, ciphertext, authTag } = encryptContent(plaintext, key);
    const decrypted = decryptContent(ciphertext, iv, authTag, key);

    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertexts for the same plaintext (random IV)', () => {
    const plaintext = 'Same content, different encryption';
    const enc1 = encryptContent(plaintext, key);
    const enc2 = encryptContent(plaintext, key);

    // IVs should differ
    expect(enc1.iv.equals(enc2.iv)).toBe(false);
    // Ciphertexts should differ
    expect(enc1.ciphertext.equals(enc2.ciphertext)).toBe(false);
    // But both should decrypt to the same plaintext
    expect(decryptContent(enc1.ciphertext, enc1.iv, enc1.authTag, key)).toBe(plaintext);
    expect(decryptContent(enc2.ciphertext, enc2.iv, enc2.authTag, key)).toBe(plaintext);
  });

  it('should fail with wrong key', () => {
    const plaintext = 'Secret data';
    const { iv, ciphertext, authTag } = encryptContent(plaintext, key);
    const wrongKey = crypto.randomBytes(32);

    expect(() => decryptContent(ciphertext, iv, authTag, wrongKey)).toThrow();
  });

  it('should fail with tampered ciphertext', () => {
    const plaintext = 'Integrity check';
    const { iv, ciphertext, authTag } = encryptContent(plaintext, key);

    // Tamper with ciphertext
    const tampered = Buffer.from(ciphertext);
    tampered[0] = tampered[0]! ^ 0xff;

    expect(() => decryptContent(tampered, iv, authTag, key)).toThrow();
  });

  it('should fail with tampered auth tag', () => {
    const plaintext = 'Auth tag check';
    const { iv, ciphertext, authTag } = encryptContent(plaintext, key);

    const tamperedTag = Buffer.from(authTag);
    tamperedTag[0] = tamperedTag[0]! ^ 0xff;

    expect(() => decryptContent(ciphertext, iv, tamperedTag, key)).toThrow();
  });

  it('should handle empty string', () => {
    // Note: Zod schema requires min(1) so empty string won't reach here in practice,
    // but the crypto layer should handle it
    const plaintext = '';
    const { iv, ciphertext, authTag } = encryptContent(plaintext, key);
    const decrypted = decryptContent(ciphertext, iv, authTag, key);
    expect(decrypted).toBe('');
  });

  it('should handle unicode content', () => {
    const plaintext = 'Unicode test: 你好世界 🌍 ñ é ü';
    const { iv, ciphertext, authTag } = encryptContent(plaintext, key);
    const decrypted = decryptContent(ciphertext, iv, authTag, key);
    expect(decrypted).toBe(plaintext);
  });

  it('should handle large content', () => {
    const plaintext = 'x'.repeat(50000);
    const { iv, ciphertext, authTag } = encryptContent(plaintext, key);
    const decrypted = decryptContent(ciphertext, iv, authTag, key);
    expect(decrypted).toBe(plaintext);
  });
});

describe('hashContent', () => {
  it('should produce consistent SHA-256 hashes', () => {
    const text = 'Hello, world!';
    const hash1 = hashContent(text);
    const hash2 = hashContent(text);
    expect(hash1).toBe(hash2);
    // SHA-256 produces 64 hex chars
    expect(hash1.length).toBe(64);
  });

  it('should produce different hashes for different content', () => {
    expect(hashContent('content A')).not.toBe(hashContent('content B'));
  });

  it('should produce hex-encoded output', () => {
    const hash = hashContent('test');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
