import { getDatabase, closeDatabase } from '../db/database.js';
import { getEncryptionKey, initPassphraseKey, initRawKey, loadKeyMaterial } from '../crypto/keys.js';
import { decryptContent, encryptContent } from '../crypto/encryption.js';
import { getAllMemories, updateMemoryEncryption } from '../db/queries.js';
import { prompt } from '../lib/prompt.js';

/**
 * memex key rotate — decrypt all memories with old key, re-encrypt with new key.
 */
export async function rotateKey(): Promise<void> {
  const material = loadKeyMaterial();

  // Get old encryption key
  let oldKey: Buffer;
  if (material.mode === 'passphrase') {
    const oldPass = await prompt('Enter current passphrase: ', true);
    oldKey = getEncryptionKey(oldPass);
  } else {
    oldKey = getEncryptionKey();
  }

  // Get new key setup
  const usePassphrase = await prompt('Use passphrase for new key? (y/N): ');
  let newKey: Buffer;

  if (usePassphrase.toLowerCase() === 'y') {
    const newPass = await prompt('Enter new passphrase (min 8 chars): ', true);
    if (newPass.length < 8) {
      console.error('Error: Passphrase must be at least 8 characters.');
      process.exit(1);
    }
    const confirm = await prompt('Confirm new passphrase: ', true);
    if (newPass !== confirm) {
      console.error('Error: Passphrases do not match.');
      process.exit(1);
    }
    // Initialize the new key material first (to get the salt)
    initPassphraseKey(newPass);
    newKey = getEncryptionKey(newPass);
  } else {
    initRawKey();
    newKey = getEncryptionKey();
  }

  // Re-encrypt all memories
  const db = getDatabase();
  const memories = getAllMemories(db);

  process.stdout.write(`Re-encrypting ${memories.length} memories...`);

  const transaction = db.transaction(() => {
    for (const mem of memories) {
      // Decrypt with old key
      const plaintext = decryptContent(
        mem.content_enc as unknown as Buffer,
        mem.iv as unknown as Buffer,
        mem.auth_tag as unknown as Buffer,
        oldKey,
      );

      // Re-encrypt with new key
      const { iv, ciphertext, authTag } = encryptContent(plaintext, newKey);

      // Update in DB
      updateMemoryEncryption(db, mem.id, ciphertext, iv, authTag);
    }
  });

  transaction();
  console.log(' done.');
  console.log('Key rotated successfully.');

  closeDatabase();
}
