import fs from 'node:fs';
import path from 'node:path';
import { getDatabase, closeDatabase } from '../db/database.js';
import { getEncryptionKey, keyMaterialExists } from '../crypto/keys.js';
import { handleSaveMemory } from '../tools/save-memory.js';
import { resolveProject } from '../lib/project.js';

interface SeedEntry {
  content: string;
  tags: string[];
}

/**
 * Collect seed entries from the current project.
 * Shared by both runSeed (interactive CLI) and runSeedQuiet (called from init).
 */
function collectEntries(project: string): SeedEntry[] {

  const entries: SeedEntry[] = [];

  // 1. package.json — extract project identity
  const pkgPath = path.join(project, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const parts: string[] = [];
      if (pkg.name) parts.push(`Project name: ${pkg.name}`);
      if (pkg.description) parts.push(`Description: ${pkg.description}`);
      if (pkg.scripts) {
        const scripts = Object.keys(pkg.scripts).join(', ');
        parts.push(`Available scripts: ${scripts}`);
      }

      // Extract key deps
      const deps = Object.keys(pkg.dependencies ?? {});
      const devDeps = Object.keys(pkg.devDependencies ?? {});
      if (deps.length > 0) {
        // Pick the most important deps (frameworks, DBs, etc.)
        const notable = deps.filter((d) =>
          /react|next|express|fastapi|drizzle|prisma|tailwind|vue|angular|svelte|sqlite|postgres|mongo|redis|stripe|auth/i.test(d)
        );
        if (notable.length > 0) {
          parts.push(`Key dependencies: ${notable.join(', ')}`);
        }
        parts.push(`Total dependencies: ${deps.length} prod, ${devDeps.length} dev`);
      }

      if (parts.length > 0) {
        entries.push({
          content: parts.join('\n'),
          tags: ['project-info', 'stack'],
        });
      }
    } catch {
      // Skip malformed package.json
    }
  }

  // 2. pyproject.toml or requirements.txt — Python project identity
  const pyprojectPath = path.join(project, 'pyproject.toml');
  const requirementsPath = path.join(project, 'requirements.txt');
  if (fs.existsSync(pyprojectPath)) {
    const content = fs.readFileSync(pyprojectPath, 'utf8');
    // Extract key info from pyproject.toml
    const nameMatch = content.match(/^name\s*=\s*"(.+)"/m);
    const descMatch = content.match(/^description\s*=\s*"(.+)"/m);
    const parts: string[] = [];
    if (nameMatch) parts.push(`Project name: ${nameMatch[1]}`);
    if (descMatch) parts.push(`Description: ${descMatch[1]}`);
    if (parts.length > 0) {
      entries.push({ content: parts.join('\n'), tags: ['project-info', 'stack'] });
    }
  } else if (fs.existsSync(requirementsPath)) {
    const content = fs.readFileSync(requirementsPath, 'utf8');
    const deps = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
    if (deps.length > 0) {
      entries.push({
        content: `Python project. Key dependencies:\n${deps.slice(0, 15).join('\n')}`,
        tags: ['project-info', 'stack'],
      });
    }
  }

  // 3. README.md — project overview (first 500 chars)
  const readmePath = path.join(project, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, 'utf8');
    const trimmed = readme.slice(0, 1500).trim();
    if (trimmed.length > 50) {
      entries.push({
        content: `Project README overview:\n\n${trimmed}`,
        tags: ['project-info', 'overview'],
      });
    }
  }

  // 4. CLAUDE.md — existing AI instructions
  const claudeMdPath = path.join(project, 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath)) {
    const content = fs.readFileSync(claudeMdPath, 'utf8').slice(0, 2000).trim();
    if (content.length > 20) {
      entries.push({
        content: `Project AI instructions (CLAUDE.md):\n\n${content}`,
        tags: ['project-info', 'instructions'],
      });
    }
  }

  // 5. AI tool config files — import context from other agents
  const aiConfigs: { file: string; label: string; tag: string; glob?: boolean }[] = [
    { file: '.cursorrules', label: 'Cursor', tag: 'cursor' },
    { file: '.windsurfrules', label: 'Windsurf', tag: 'windsurf' },
    { file: '.codex/instructions.md', label: 'Codex', tag: 'codex' },
    { file: '.github/copilot-instructions.md', label: 'GitHub Copilot', tag: 'copilot' },
  ];

  for (const cfg of aiConfigs) {
    const cfgPath = path.join(project, cfg.file);
    if (fs.existsSync(cfgPath)) {
      const content = fs.readFileSync(cfgPath, 'utf8').slice(0, 2000).trim();
      if (content.length > 20) {
        entries.push({
          content: `${cfg.label} instructions (${cfg.file}):\n\n${content}`,
          tags: ['import', cfg.tag, 'instructions'],
        });
      }
    }
  }

  // 5b. Cursor rules directory (multiple files)
  const cursorRulesDir = path.join(project, '.cursor', 'rules');
  if (fs.existsSync(cursorRulesDir)) {
    try {
      const ruleFiles = fs.readdirSync(cursorRulesDir).filter((f) => f.endsWith('.md') || f.endsWith('.mdc'));
      for (const ruleFile of ruleFiles) {
        const content = fs.readFileSync(path.join(cursorRulesDir, ruleFile), 'utf8').slice(0, 2000).trim();
        if (content.length > 20) {
          entries.push({
            content: `Cursor rule (${ruleFile}):\n\n${content}`,
            tags: ['import', 'cursor', 'instructions'],
          });
        }
      }
    } catch {
      // Skip if unreadable
    }
  }

  // 6. Detect project structure
  const structure: string[] = [];
  const srcDir = path.join(project, 'src');
  const appDir = path.join(project, 'app');
  const pagesDir = path.join(project, 'pages');

  if (fs.existsSync(srcDir)) structure.push('src/ directory');
  if (fs.existsSync(appDir)) structure.push('app/ directory (Next.js App Router)');
  if (fs.existsSync(pagesDir)) structure.push('pages/ directory (Next.js Pages Router)');
  if (fs.existsSync(path.join(project, 'docker-compose.yml'))) structure.push('Docker Compose');
  if (fs.existsSync(path.join(project, 'Dockerfile'))) structure.push('Dockerfile');
  if (fs.existsSync(path.join(project, '.github'))) structure.push('GitHub Actions');
  if (fs.existsSync(path.join(project, 'tsconfig.json'))) structure.push('TypeScript');
  if (fs.existsSync(path.join(project, 'tailwind.config.ts')) || fs.existsSync(path.join(project, 'tailwind.config.js'))) structure.push('Tailwind CSS');
  if (fs.existsSync(path.join(project, 'drizzle.config.ts'))) structure.push('Drizzle ORM');
  if (fs.existsSync(path.join(project, 'prisma'))) structure.push('Prisma');

  if (structure.length > 0) {
    entries.push({
      content: `Project structure includes: ${structure.join(', ')}`,
      tags: ['project-info', 'structure'],
    });
  }

  return entries;
}

/**
 * Save collected entries and return counts.
 */
function saveEntries(
  entries: SeedEntry[],
  db: ReturnType<typeof getDatabase>,
  key: Buffer,
  log = true,
): { saved: number; dupes: number } {
  let saved = 0;
  let dupes = 0;
  for (const entry of entries) {
    const result = handleSaveMemory(db, key, {
      content: entry.content,
      tags: entry.tags,
    });
    if (result.duplicate) {
      dupes++;
    } else {
      saved++;
      if (log) {
        console.log(`  Saved: [${entry.tags.join(', ')}]`);
      }
    }
  }
  return { saved, dupes };
}

/**
 * memex seed — scan the current project and pre-populate memories.
 *
 * Reads key files (README, package.json, CLAUDE.md, AI tool configs, etc.)
 * and creates starter memories so the agent has context on first run.
 */
export async function runSeed(): Promise<void> {
  console.log('');

  if (!keyMaterialExists()) {
    console.log('Memex is not initialized yet. Run:');
    console.log('  npx memex-mcp init');
    console.log('');
    return;
  }

  const project = resolveProject();
  const db = getDatabase();
  const key = getEncryptionKey();

  console.log('Memex Seed');
  console.log('==========');
  console.log(`Project: ${project}`);
  console.log('');
  console.log('Scanning project files...');

  const entries = collectEntries(project);

  if (entries.length === 0) {
    console.log('No project files found to seed from.');
    console.log('');
    closeDatabase();
    return;
  }

  const { saved, dupes } = saveEntries(entries, db, key);

  console.log('');
  console.log(`Done! ${saved} memories saved${dupes > 0 ? `, ${dupes} duplicates skipped` : ''}.`);
  console.log('');
  console.log('Your AI agent now has project context from day one.');
  console.log("Run 'memex memories list' to see what was saved.");
  console.log('');

  closeDatabase();
}

/**
 * Quiet version of seed — called from init. Returns counts, minimal logging.
 */
export async function runSeedQuiet(): Promise<{ saved: number; dupes: number }> {
  const project = resolveProject();
  const db = getDatabase();
  const key = getEncryptionKey();
  const entries = collectEntries(project);

  if (entries.length === 0) {
    return { saved: 0, dupes: 0 };
  }

  return saveEntries(entries, db, key, false);
}
