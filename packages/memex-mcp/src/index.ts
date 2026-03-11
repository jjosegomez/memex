import { Command } from 'commander';

const program = new Command();

program
  .name('memex')
  .description('Portable, E2E encrypted AI memory for developers')
  .version('0.1.0');

program
  .command('serve')
  .description('Start the MCP server (used by AI agents)')
  .action(async () => {
    const { startServer } = await import('./server.js');
    await startServer();
  });

program
  .command('init')
  .description('Initialize Memex (encryption key + database + agent config)')
  .option('--passphrase', 'Derive key from a passphrase instead of generating a random key')
  .action(async (opts) => {
    const { runInit } = await import('./cli/init.js');
    await runInit({ usePassphrase: opts.passphrase === true });
  });

program
  .command('status')
  .description('Show Memex configuration status')
  .action(async () => {
    const { runStatus } = await import('./cli/status.js');
    await runStatus();
  });

program
  .command('demo')
  .description('Run a quick demo to verify Memex works')
  .action(async () => {
    const { runDemo } = await import('./cli/demo.js');
    await runDemo();
  });

program
  .command('seed')
  .description('Pre-load project context from your codebase')
  .action(async () => {
    const { runSeed } = await import('./cli/seed.js');
    await runSeed();
  });

const memoriesCmd = program
  .command('memories')
  .description('Manage stored memories');

memoriesCmd
  .command('list')
  .description('List memories')
  .option('-p, --project <path>', 'Filter by project')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('-l, --limit <n>', 'Max results', '20')
  .action(async (opts) => {
    const { listMemories } = await import('./cli/memories.js');
    await listMemories(opts);
  });

memoriesCmd
  .command('search <query>')
  .description('Search memories across all projects')
  .option('-l, --limit <n>', 'Max results', '10')
  .action(async (query, opts) => {
    const { searchMemories } = await import('./cli/memories.js');
    await searchMemories(query, opts);
  });

memoriesCmd
  .command('delete <id>')
  .description('Delete a memory')
  .action(async (id) => {
    const { deleteMemory } = await import('./cli/memories.js');
    await deleteMemory(id);
  });

memoriesCmd
  .command('purge')
  .description('Permanently remove all soft-deleted memories')
  .action(async () => {
    const { purgeMemories } = await import('./cli/memories.js');
    await purgeMemories();
  });

const sessionsCmd = program
  .command('sessions')
  .description('Manage recorded sessions');

sessionsCmd
  .command('list')
  .description('List recorded sessions')
  .option('-p, --project <path>', 'Filter by project')
  .option('-a, --agent <source>', 'Filter by agent source')
  .option('-s, --status <status>', 'Filter: active, ended, all', 'all')
  .option('-l, --limit <n>', 'Max results', '20')
  .action(async (opts) => {
    const { listSessionsCli } = await import('./cli/sessions.js');
    await listSessionsCli(opts);
  });

sessionsCmd
  .command('search <query>')
  .description('Search across session content')
  .option('-p, --project <path>', 'Filter by project')
  .option('-l, --limit <n>', 'Max results', '10')
  .action(async (query, opts) => {
    const { searchSessionsCli } = await import('./cli/sessions.js');
    await searchSessionsCli(query, opts);
  });

sessionsCmd
  .command('show <id>')
  .description('Show session details and event timeline')
  .option('-t, --type <types>', 'Filter event types (comma-separated)')
  .option('-l, --limit <n>', 'Max events', '100')
  .action(async (id, opts) => {
    const { showSession } = await import('./cli/sessions.js');
    await showSession(id, opts);
  });

sessionsCmd
  .command('import <file>')
  .description('Import a session transcript (JSONL)')
  .option('-a, --agent <source>', 'Agent source (claude-code, generic)', 'generic')
  .action(async (file, opts) => {
    const { importSession } = await import('./cli/sessions.js');
    await importSession(file, opts);
  });

sessionsCmd
  .command('extract <id>')
  .description('Extract insights from a session (heuristics + optional LLM)')
  .action(async (id) => {
    const { extractSession } = await import('./cli/sessions.js');
    await extractSession(id);
  });

program
  .command('export')
  .description('Export memories as JSON')
  .option('-p, --project <path>', 'Export only a specific project')
  .action(async (opts) => {
    const { runExport } = await import('./cli/export.js');
    await runExport(opts);
  });

const keyCmd = program
  .command('key')
  .description('Manage encryption keys');

keyCmd
  .command('rotate')
  .description('Re-encrypt all memories with a new key')
  .action(async () => {
    const { rotateKey } = await import('./cli/key.js');
    await rotateKey();
  });

program.parse();
