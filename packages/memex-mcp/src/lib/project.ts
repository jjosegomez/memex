import path from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Resolve project scope.
 *
 * Resolution order:
 *   1. Explicit param (if provided)
 *   2. Git repo root (via `git rev-parse --show-toplevel`)
 *   3. Current working directory as fallback
 */
export function resolveProject(explicit?: string): string {
  if (explicit) return path.resolve(explicit);

  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return gitRoot;
  } catch {
    return process.cwd();
  }
}
