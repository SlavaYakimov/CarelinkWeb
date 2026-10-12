#!/usr/bin/env node
/**
 * Clone SlavaYakimov/CarelinkAuth when GITHUB_TOKEN (or CARELINK_AUTH_PAT) has repo access.
 * Default target: ../CarelinkAuth (sibling of CarelinkWeb), override with E2E_CARELINK_AUTH_ROOT.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCarelinkAuthRoot } from './carelink-auth-compose.mjs';

const execFileAsync = promisify(execFile);
const WEB_REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REPO = 'https://github.com/SlavaYakimov/CarelinkAuth.git';

const target = resolveCarelinkAuthRoot();
if (existsSync(path.join(target, 'docker-compose.yml'))) {
  console.log(`CarelinkAuth already present at ${target}`);
  process.exit(0);
}

const token = process.env.CARELINK_AUTH_PAT?.trim() || process.env.GITHUB_TOKEN?.trim();
if (!token) {
  console.error(
    'clone-carelink-auth: set GITHUB_TOKEN or CARELINK_AUTH_PAT with read access to CarelinkAuth.',
  );
  process.exit(1);
}

const cloneUrl = REPO.replace('https://', `https://x-access-token:${token}@`);
await execFileAsync('git', ['clone', '--depth', '1', cloneUrl, target], {
  cwd: WEB_REPO_ROOT,
  env: process.env,
});
console.log(`Cloned CarelinkAuth to ${target}`);
