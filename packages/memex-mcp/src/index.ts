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
  .option('--no-passphrase', 'Use a random key instead of a passphrase')
  .action(async (opts) => {
    const { runInit } = await import('./cli/init.js');
    await runInit({ noPassphrase: opts.passphrase === false });
  });

program
  .command('status')
  .description('Show Memex configuration status')
  .action(async () => {
    const { runStatus } = await import('./cli/status.js');
    await runStatus();
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
