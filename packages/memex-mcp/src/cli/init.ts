import readline from 'node:readline';
import { getConfigDir, getDataDir, getKeyFilePath, getDbPath } from '../lib/paths.js';
import { ensureDir } from '../lib/config.js';
import { initPassphraseKey, initRawKey, keyMaterialExists } from '../crypto/keys.js';
import { getDatabase, closeDatabase } from '../db/database.js';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

/**
 * Prompt user for input (supports hidden input for passwords).
 */
function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (hidden) {
      // Write the question manually, then mute stdout
      process.stdout.write(question);
      const stdin = process.stdin;
      const wasRaw = stdin.isRaw;
      if (stdin.isTTY) {
        stdin.setRawMode(true);
      }
      let input = '';
      const onData = (char: Buffer) => {
        const c = char.toString('utf8');
        if (c === '\n' || c === '\r') {
          if (stdin.isTTY) {
            stdin.setRawMode(wasRaw ?? false);
          }
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          rl.close();
          resolve(input);
        } else if (c === '\u0003') {
          // Ctrl+C
          process.exit(1);
        } else if (c === '\u007f' || c === '\b') {
          // Backspace
          input = input.slice(0, -1);
        } else {
          input += c;
        }
      };
      stdin.on('data', onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

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
  console.log('Step 1/3: Encryption Setup');
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
  console.log('Step 2/3: Database');
  ensureDir(getDataDir());
  const db = getDatabase();
  console.log(`  Database location: ${getDbPath()}`);
  console.log('  Database created and schema initialized.');
  closeDatabase();
  console.log('');

  // Step 3: Claude Code integration
  console.log('Step 3/3: Claude Code Integration');
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
  console.log('Setup complete! Memex is ready.');
  console.log("  - Your AI agents will now remember context across sessions.");
  console.log("  - Run 'memex status' to check configuration.");
  console.log("  - Run 'memex memories list' to see stored memories.");
  console.log('');
}
