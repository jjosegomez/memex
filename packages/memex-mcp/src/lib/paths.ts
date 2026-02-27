import path from 'node:path';
import os from 'node:os';

/**
 * XDG-compliant path resolution for Memex data and config.
 *
 * Config dir: $XDG_CONFIG_HOME/memex/ or ~/.config/memex/
 * Data dir:   $XDG_DATA_HOME/memex/ or ~/.local/share/memex/
 */

export function getConfigDir(): string {
  const xdgConfig = process.env['XDG_CONFIG_HOME'];
  const base = xdgConfig || path.join(os.homedir(), '.config');
  return path.join(base, 'memex');
}

export function getDataDir(): string {
  const xdgData = process.env['XDG_DATA_HOME'];
  const base = xdgData || path.join(os.homedir(), '.local', 'share');
  return path.join(base, 'memex');
}

export function getKeyFilePath(): string {
  return path.join(getConfigDir(), 'key.enc');
}

export function getDbPath(): string {
  return path.join(getDataDir(), 'memex.db');
}
