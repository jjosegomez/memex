import crypto from 'node:crypto';

/**
 * ULID: Universally Unique Lexicographically Sortable Identifier
 *
 * Crockford's Base32 encoding.
 * 10 chars timestamp (48-bit ms) + 16 chars random (80-bit from crypto.randomBytes).
 * Total: 26 characters.
 */

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function ulid(): string {
  const now = Date.now();
  let timeStr = '';

  // Timestamp portion: 10 chars, 48-bit millisecond precision
  let t = now;
  for (let i = 9; i >= 0; i--) {
    timeStr = ENCODING[t % 32]! + timeStr;
    t = Math.floor(t / 32);
  }

  // Randomness portion: 16 chars, 80-bit from crypto
  // We need 16 base32 chars = 80 bits. Using 10 bytes (80 bits).
  // Encode 10 bytes as 16 base32 characters using bit manipulation.
  const bytes = crypto.randomBytes(10);
  let randStr = '';

  // Process 5 bytes at a time (40 bits = 8 base32 chars)
  for (let chunk = 0; chunk < 2; chunk++) {
    const offset = chunk * 5;
    const b0 = bytes[offset]!;
    const b1 = bytes[offset + 1]!;
    const b2 = bytes[offset + 2]!;
    const b3 = bytes[offset + 3]!;
    const b4 = bytes[offset + 4]!;

    randStr += ENCODING[(b0 >> 3) & 0x1f];
    randStr += ENCODING[((b0 << 2) | (b1 >> 6)) & 0x1f];
    randStr += ENCODING[(b1 >> 1) & 0x1f];
    randStr += ENCODING[((b1 << 4) | (b2 >> 4)) & 0x1f];
    randStr += ENCODING[((b2 << 1) | (b3 >> 7)) & 0x1f];
    randStr += ENCODING[(b3 >> 2) & 0x1f];
    randStr += ENCODING[((b3 << 3) | (b4 >> 5)) & 0x1f];
    randStr += ENCODING[b4 & 0x1f];
  }

  return timeStr + randStr;
}
