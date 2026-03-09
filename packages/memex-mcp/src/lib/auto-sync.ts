import fs from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { handleSaveMemory } from '../tools/save-memory.js';
import { findByTagsAndProject, hardDeleteMemory } from '../db/queries.js';
import { hashContent } from '../crypto/hash.js';
import { resolveProject } from './project.js';

interface ConfigSource {
  file: string;
  label: string;
  tag: string;
}

const AI_CONFIGS: ConfigSource[] = [
  { file: 'CLAUDE.md', label: 'Claude Code', tag: 'claude' },
  { file: '.cursorrules', label: 'Cursor', tag: 'cursor' },
  { file: '.windsurfrules', label: 'Windsurf', tag: 'windsurf' },
  { file: '.codex/instructions.md', label: 'Codex', tag: 'codex' },
  { file: '.github/copilot-instructions.md', label: 'GitHub Copilot', tag: 'copilot' },
];

/**
 * Auto-sync AI tool config files on MCP server startup.
 *
 * For each known config file in the current project:
 * - If new: save as memory
 * - If changed: replace old memory with updated content
 * - If unchanged: skip silently
 *
 * Runs silently — logs only to stderr (stdout is reserved for MCP JSON-RPC).
 */
export function autoSyncConfigs(db: Database.Database, key: Buffer): void {
  const project = resolveProject();

  for (const cfg of AI_CONFIGS) {
    syncFile(db, key, project, cfg);
  }

  // Cursor rules directory (multiple files)
  const cursorRulesDir = path.join(project, '.cursor', 'rules');
  if (fs.existsSync(cursorRulesDir)) {
    try {
      const ruleFiles = fs
        .readdirSync(cursorRulesDir)
        .filter((f) => f.endsWith('.md') || f.endsWith('.mdc'));
      for (const ruleFile of ruleFiles) {
        syncFile(db, key, project, {
          file: `.cursor/rules/${ruleFile}`,
          label: 'Cursor',
          tag: 'cursor',
        });
      }
    } catch {
      // Skip if unreadable
    }
  }
}

function syncFile(
  db: Database.Database,
  key: Buffer,
  project: string,
  cfg: ConfigSource,
): void {
  const filePath = path.join(project, cfg.file);
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, 'utf8').slice(0, 2000).trim();
  if (raw.length <= 20) return;

  const content = `${cfg.label} instructions (${cfg.file}):\n\n${raw}`;
  const contentHash = hashContent(content);

  // The source tag uniquely identifies which file this memory came from
  const sourceTag = `source:${cfg.file}`;
  const tags = ['auto-sync', cfg.tag, 'instructions', sourceTag];

  // Check if we already have a memory for this exact file
  const existing = findByTagsAndProject(db, ['auto-sync', sourceTag], project);

  if (existing.length > 0) {
    // File already tracked — check if content changed
    if (existing[0].content_hash === contentHash) {
      return; // Unchanged, skip
    }
    // Content changed — delete old version(s), save new
    for (const old of existing) {
      hardDeleteMemory(db, old.id);
    }
    console.error(`[memex] Updated: ${cfg.file}`);
  } else {
    console.error(`[memex] Imported: ${cfg.file}`);
  }

  handleSaveMemory(db, key, { content, tags });
}
