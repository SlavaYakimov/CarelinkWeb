#!/usr/bin/env node
/**
 * Production server after `pnpm build`.
 * - Default: `next start` (Server Actions + Cypress/E2E; same `.next` output as standalone).
 * - Set CARELINK_STANDALONE=1 to run `.next/standalone/server.js` (Docker parity).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const standaloneServer = path.join(repoRoot, '.next', 'standalone', 'server.js');
const buildId = path.join(repoRoot, '.next', 'BUILD_ID');

function runNodeServer(serverPath, cwd) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: 'inherit',
    env: process.env,
    cwd,
  });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
}

function runNextStart() {
  const child = spawn('pnpm', ['exec', 'next', 'start'], {
    stdio: 'inherit',
    env: process.env,
    cwd: repoRoot,
    shell: true,
  });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
}

if (!existsSync(buildId)) {
  console.error('start: run `pnpm build` first (missing .next/BUILD_ID)');
  process.exit(1);
}

const useStandalone = process.env.CARELINK_STANDALONE === '1' && existsSync(standaloneServer);

if (useStandalone) {
  runNodeServer(standaloneServer, path.dirname(standaloneServer));
} else {
  runNextStart();
}
