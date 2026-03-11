import { execSync, spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

/**
 * memex dashboard — starts the Next.js dashboard on the given port.
 */
export async function runDashboard(opts: { port?: string }): Promise<void> {
  const port = opts.port || '3200';

  // Find the dashboard package relative to this script
  // In development: ../../dashboard (from packages/memex-mcp/src/cli/)
  // When installed: check common locations
  const possiblePaths = [
    path.resolve(__dirname, '..', '..', '..', 'dashboard'),
    path.resolve(__dirname, '..', '..', 'dashboard'),
    path.resolve(process.cwd(), 'packages', 'dashboard'),
  ];

  let dashboardDir = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(path.join(p, 'package.json'))) {
      dashboardDir = p;
      break;
    }
  }

  if (!dashboardDir) {
    console.log('Memex Dashboard');
    console.log('');
    console.log('The dashboard package was not found.');
    console.log('');
    console.log('To use the dashboard, clone the Memex repo and run:');
    console.log('  cd packages/dashboard');
    console.log(`  npm run dev -- -p ${port}`);
    console.log('');
    console.log('Or from the repo root:');
    console.log(`  npm run dev:dashboard`);
    return;
  }

  console.log(`Starting Memex Dashboard on http://localhost:${port}`);
  console.log(`Dashboard path: ${dashboardDir}`);
  console.log('');

  // Check if dependencies are installed
  if (!fs.existsSync(path.join(dashboardDir, 'node_modules'))) {
    console.log('Installing dashboard dependencies...');
    execSync('npm install', { cwd: dashboardDir, stdio: 'inherit' });
  }

  // Try to open the browser after a short delay
  setTimeout(() => {
    try {
      execSync(`open http://localhost:${port}`, { stdio: 'ignore' });
    } catch {
      // Non-macOS or open failed — that's fine
    }
  }, 2000);

  // Start the dev server
  const child = spawn('npx', ['next', 'dev', '-p', port], {
    cwd: dashboardDir,
    stdio: 'inherit',
    env: { ...process.env },
  });

  child.on('error', (err) => {
    console.error(`Failed to start dashboard: ${err.message}`);
    process.exit(1);
  });

  // Forward signals
  process.on('SIGINT', () => { child.kill('SIGINT'); });
  process.on('SIGTERM', () => { child.kill('SIGTERM'); });

  await new Promise<void>((resolve) => {
    child.on('close', () => resolve());
  });
}
