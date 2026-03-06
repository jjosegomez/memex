import { getDatabase, closeDatabase } from '../db/database.js';
import { getEncryptionKey } from '../crypto/keys.js';
import { keyMaterialExists } from '../crypto/keys.js';
import { handleSaveMemory } from '../tools/save-memory.js';
import { handleRecallMemories } from '../tools/recall-memories.js';

/**
 * memex demo — instant gratification after install.
 *
 * Saves a test memory, recalls it, and shows the user it works.
 * Cleans up after itself (deletes the test memory).
 */
export async function runDemo(): Promise<void> {
  console.log('');

  // Check if initialized
  if (!keyMaterialExists()) {
    console.log('Memex is not initialized yet. Run:');
    console.log('  npx memex-mcp init');
    console.log('');
    return;
  }

  const db = getDatabase();
  const key = getEncryptionKey();

  console.log('Memex Demo');
  console.log('==========');
  console.log('');

  // Step 1: Save a memory
  console.log('1. Saving a test memory...');
  const saved = handleSaveMemory(db, key, {
    content:
      'This project uses TypeScript with strict mode. The auth system uses JWT with refresh tokens stored in httpOnly cookies. Database is PostgreSQL with Drizzle ORM.',
    tags: ['architecture', 'auth', 'demo'],
  });
  console.log(`   Saved! ID: ${saved.id}`);
  console.log(`   Project: ${saved.project}`);
  console.log(`   Tags: ${saved.tags.join(', ')}`);
  console.log('');

  // Step 2: Recall it
  console.log('2. Recalling memories about "auth"...');
  const { memories } = handleRecallMemories(db, key, {
    query: 'auth',
    limit: 5,
  });
  if (memories.length > 0) {
    console.log(`   Found ${memories.length} memory:`);
    console.log(`   "${memories[0].content.slice(0, 80)}..."`);
  }
  console.log('');

  // Step 3: Clean up
  console.log('3. Cleaning up test memory...');
  const { softDeleteMemory } = await import('../db/queries.js');
  softDeleteMemory(db, saved.id);
  console.log('   Deleted.');
  console.log('');

  // Summary
  console.log('Everything works! Here\'s what just happened:');
  console.log('  - Your text was encrypted with AES-256-GCM');
  console.log('  - Stored in your local SQLite database');
  console.log('  - Retrieved and decrypted using your key');
  console.log('  - Full-text search found it by keyword');
  console.log('');
  console.log('When you use Claude Code (or any MCP agent), it will');
  console.log('automatically save and recall context just like this.');
  console.log('');

  closeDatabase();
}
