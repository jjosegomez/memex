import fs from 'node:fs';
import path from 'node:path';
import { getConfigDir, getDataDir, getKeyFilePath, getDbPath } from '../lib/paths.js';
import { ensureDir } from '../lib/config.js';
import { prompt } from '../lib/prompt.js';
import { initPassphraseKey, initRawKey, keyMaterialExists } from '../crypto/keys.js';
import { getDatabase, closeDatabase } from '../db/database.js';
import { execSync } from 'node:child_process';

/**
 * Check if Claude Code CLI is available.
 */
function isClaudeCodeAvailable(): boolean {
  try {
    execSync('which claude', { stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Register Memex MCP server with Claude Code.
 */
function registerWithClaudeCode(): boolean {
  try {
    execSync(
      'claude mcp add memex --transport stdio -- npx -y memex-mcp serve',
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * memex init command implementation.
 *
 * Default mode: generate raw key (no passphrase).
 * With --passphrase flag: prompt for passphrase, derive key.
 */
export async function runInit(opts: { usePassphrase: boolean }): Promise<void> {
  console.log('');
  console.log('Memex - AI Memory for Developers');
  console.log('=================================');
  console.log('');

  // Check if already initialized
  if (keyMaterialExists()) {
    console.log('Memex is already initialized.');
    console.log(`  Key file: ${getKeyFilePath()}`);
    console.log(`  Database: ${getDbPath()}`);
    console.log('');
    console.log('To re-initialize, delete the key file and database first.');
    return;
  }

  // Step 1: Encryption setup
  console.log('Step 1/5: Encryption Setup');
  ensureDir(getConfigDir());

  if (!opts.usePassphrase) {
    // Raw key mode (default)
    initRawKey();
    console.log('  Generated random encryption key.');
    console.log(`  Key saved to ${getKeyFilePath()}`);
    console.log('  (Protected by filesystem permissions, no passphrase needed)');
  } else {
    // Passphrase mode (opt-in via --passphrase)
    const isTTY = process.stdin.isTTY;
    if (!isTTY) {
      // Non-interactive — check MEMEX_PASSPHRASE env var
      const envPass = process.env['MEMEX_PASSPHRASE'];
      if (!envPass || envPass.length < 8) {
        console.error('  Error: Set MEMEX_PASSPHRASE env var (min 8 chars) for non-interactive mode.');
        process.exit(1);
      }
      initPassphraseKey(envPass);
      console.log('  Key derived from MEMEX_PASSPHRASE env var.');
    } else {
      const passphrase = await prompt('  Enter a passphrase (min 8 chars): ', true);
      if (passphrase.length < 8) {
        console.error('  Error: Passphrase must be at least 8 characters.');
        process.exit(1);
      }
      const confirm = await prompt('  Confirm passphrase: ', true);
      if (passphrase !== confirm) {
        console.error('  Error: Passphrases do not match.');
        process.exit(1);
      }
      initPassphraseKey(passphrase);
    }
    console.log(`  Key derived and saved to ${getKeyFilePath()}`);
  }
  console.log('');

  // Step 2: Database
  console.log('Step 2/5: Database');
  ensureDir(getDataDir());
  const db = getDatabase();
  console.log(`  Database location: ${getDbPath()}`);
  console.log('  Database created and schema initialized.');
  closeDatabase();
  console.log('');

  // Step 3: Claude Code integration
  console.log('Step 3/5: Claude Code Integration');
  if (isClaudeCodeAvailable()) {
    const registered = registerWithClaudeCode();
    if (registered) {
      console.log('  Detected Claude Code installation.');
      console.log('  Added memex MCP server to Claude Code settings.');
    } else {
      console.log('  Claude Code detected but auto-registration failed.');
      console.log('  You can manually add it:');
      console.log('    claude mcp add memex --transport stdio -- npx -y memex-mcp serve');
    }
  } else {
    console.log('  Claude Code not detected.');
    console.log('  You can add Memex to any MCP-compatible agent:');
    console.log('    claude mcp add memex --transport stdio -- npx -y memex-mcp serve');
  }
  console.log('');
  // Step 4: CLAUDE.md integration
  console.log('Step 4/5: Agent Instructions');
  const claudeMdSnippet = `
## Memex (Persistent Memory)

You have access to Memex for persistent, encrypted memory across sessions.

**Automatically save** important context as you work:
- Architecture decisions and rationale
- Coding patterns and conventions used in this project
- Debugging insights and solutions to tricky problems
- API designs, data models, and integration details

**Recall context** at the start of each session to pick up where you left off.

Use \`save_memory\` with descriptive tags like: architecture, patterns, debugging, api, auth, database.
Use \`recall_memories\` with relevant queries to retrieve past context.

**Keep the user informed**: When you save or recall memories, briefly mention it (e.g., "Saved to memory: auth uses Clerk with JWT" or "Recalled 3 memories from last session"). This helps the user know Memex is working.
`;

  // Try to find CLAUDE.md in current directory or git root
  let claudeMdPath: string | null = null;
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    claudeMdPath = path.join(gitRoot, 'CLAUDE.md');
  } catch {
    claudeMdPath = path.join(process.cwd(), 'CLAUDE.md');
  }

  if (claudeMdPath && fs.existsSync(claudeMdPath)) {
    const existing = fs.readFileSync(claudeMdPath, 'utf8');
    if (existing.includes('Memex') || existing.includes('memex')) {
      console.log('  CLAUDE.md already mentions Memex. Skipped.');
    } else {
      fs.appendFileSync(claudeMdPath, '\n' + claudeMdSnippet);
      console.log('  Added Memex instructions to your CLAUDE.md.');
      console.log('  Your agent will now use memory tools automatically.');
    }
  } else if (claudeMdPath) {
    fs.writeFileSync(claudeMdPath, claudeMdSnippet.trim() + '\n');
    console.log('  Created CLAUDE.md with Memex instructions.');
    console.log('  Your agent will now use memory tools automatically.');
  }
  console.log('');

  // Step 5: Seed project context
  console.log('Step 5/5: Project Context');
  try {
    const { runSeedQuiet } = await import('./seed.js');
    const seedResult = await runSeedQuiet();
    if (seedResult.saved > 0 || seedResult.dupes > 0) {
      if (seedResult.saved > 0) {
        console.log(`  Imported ${seedResult.saved} memories from project files.`);
      }
      if (seedResult.dupes > 0) {
        console.log(`  ${seedResult.dupes} duplicates skipped.`);
      }
    } else {
      console.log('  No project files found to import.');
    }
  } catch {
    console.log('  Skipped — run "memex seed" manually to import project context.');
  }
  console.log('');

  console.log('Setup complete! Memex is ready.');
  console.log('');
  console.log('Next steps:');
  console.log("  memex demo         Verify everything works (30 seconds)");
  console.log("  memex status       Check configuration");
  console.log('');
}
