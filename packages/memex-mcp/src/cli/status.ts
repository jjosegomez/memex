import fs from 'node:fs';
import { getKeyFilePath, getDbPath } from '../lib/paths.js';
import { keyMaterialExists, loadKeyMaterial } from '../crypto/keys.js';
import { getDatabase, closeDatabase } from '../db/database.js';
import { getMemoryCount, getProjects } from '../db/queries.js';
import { execSync } from 'node:child_process';

/**
 * Check if Claude Code has memex registered as an MCP server.
 */
function isClaudeCodeConnected(): boolean {
  try {
    const output = execSync('claude mcp list', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output.includes('memex');
  } catch {
    return false;
  }
}

/**
 * Format bytes into human-readable size.
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * memex status command implementation.
 */
export async function runStatus(): Promise<void> {
  console.log('');
  console.log('Memex Status');
  console.log('============');

  // Encryption status
  if (keyMaterialExists()) {
    const material = loadKeyMaterial();
    const mode = material.mode === 'passphrase' ? 'Passphrase (PBKDF2)' : 'Random Key';
    console.log(`  Encryption: Configured (AES-256-GCM, ${mode})`);
  } else {
    console.log('  Encryption: Not configured. Run "memex init" first.');
    console.log('');
    return;
  }

  // Database status
  const dbPath = getDbPath();
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    const db = getDatabase();
    const totalCount = getMemoryCount(db);
    console.log(`  Database:   ${dbPath} (${formatSize(stats.size)}, ${totalCount} memories)`);

    // Projects
    const projects = getProjects(db);
    if (projects.length > 0) {
      console.log(`  Projects:   ${projects.length} project${projects.length === 1 ? '' : 's'} tracked`);
      for (const p of projects) {
        console.log(`    - ${p.project} (${p.count} memories)`);
      }
    } else {
      console.log('  Projects:   No memories saved yet.');
    }

    closeDatabase();
  } else {
    console.log(`  Database:   Not found at ${dbPath}`);
  }

  // Claude Code status
  const connected = isClaudeCodeConnected();
  console.log(`  Claude Code: ${connected ? 'Connected (MCP server registered)' : 'Not connected'}`);

  console.log('');
}
