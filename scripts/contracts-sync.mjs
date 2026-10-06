#!/usr/bin/env node
/**
 * Pulls contracts/auth.openapi.yaml from CarelinkAuth (private repo).
 * Set CONTRACTS_SYNC_URL (raw file URL) or GITHUB_TOKEN to fetch from GitHub API.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'contracts', 'auth.openapi.yaml');

const defaultRaw =
  'https://raw.githubusercontent.com/SlavaYakimov/CarelinkAuth/main/docs/backend/auth/openapi.yaml';

async function main() {
  const url = process.env.CONTRACTS_SYNC_URL ?? defaultRaw;
  const token = process.env.GITHUB_TOKEN;

  if (!process.env.CONTRACTS_SYNC_URL && !token) {
    console.error(
      'contracts:sync: задайте CONTRACTS_SYNC_URL (URL raw openapi.yaml) или GITHUB_TOKEN для доступа к приватному CarelinkAuth.',
    );
    process.exit(1);
  }

  const headers = { Accept: 'application/vnd.github.raw' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error(`contracts:sync: HTTP ${res.status} ${res.statusText} для ${url}`);
    process.exit(1);
  }

  const body = await res.text();
  if (!body.includes('openapi:')) {
    console.error('contracts:sync: ответ не похож на OpenAPI YAML');
    process.exit(1);
  }

  writeFileSync(outPath, body, 'utf8');
  console.log(`contracts:sync: записано ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
