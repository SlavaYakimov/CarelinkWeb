#!/usr/bin/env node
/**
 * Pulls OpenAPI from CarelinkAuth (private repo):
 * - contracts/auth.openapi.yaml  ← docs/backend/auth/openapi.yaml
 * - contracts/family.openapi.yaml ← docs/backend/family/openapi.yaml
 *
 * Set GITHUB_TOKEN (or CONTRACTS_SYNC_TOKEN) for GitHub API raw fetch.
 * Optional overrides: CONTRACTS_SYNC_AUTH_URL, CONTRACTS_SYNC_FAMILY_URL, CONTRACTS_SYNC_REF (default main).
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const authOut = join(root, 'contracts', 'auth.openapi.yaml');
const familyOut = join(root, 'contracts', 'family.openapi.yaml');

const repo = process.env.CONTRACTS_SYNC_REPO ?? 'SlavaYakimov/CarelinkAuth';
const ref = process.env.CONTRACTS_SYNC_REF ?? 'main';
const authPath = process.env.CONTRACTS_SYNC_AUTH_PATH ?? 'docs/backend/auth/openapi.yaml';
const familyPath = process.env.CONTRACTS_SYNC_FAMILY_PATH ?? 'docs/backend/family/openapi.yaml';

const defaultAuthRaw = `https://raw.githubusercontent.com/${repo}/${ref}/${authPath}`;
const defaultFamilyRaw = `https://raw.githubusercontent.com/${repo}/${ref}/${familyPath}`;

async function fetchSpec(label, defaultRawUrl) {
  const token = process.env.CONTRACTS_SYNC_TOKEN ?? process.env.GITHUB_TOKEN;
  const envKey = label === 'auth' ? 'CONTRACTS_SYNC_AUTH_URL' : 'CONTRACTS_SYNC_FAMILY_URL';
  const resolvedUrl =
    process.env[envKey] ??
    (label === 'auth' ? process.env.CONTRACTS_SYNC_URL : undefined) ??
    defaultRawUrl;

  if (!token && resolvedUrl.includes('raw.githubusercontent.com')) {
    console.error(
      `contracts:sync: для ${label} нужен GITHUB_TOKEN / CONTRACTS_SYNC_TOKEN (приватный CarelinkAuth) или явный ${envKey}.`,
    );
    process.exit(1);
  }

  const headers = { Accept: 'application/vnd.github.raw' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(resolvedUrl, { headers });
  if (!res.ok) {
    console.error(`contracts:sync: HTTP ${res.status} ${res.statusText} для ${label} (${resolvedUrl})`);
    process.exit(1);
  }

  const body = await res.text();
  if (!body.includes('openapi:')) {
    console.error(`contracts:sync: ответ ${label} не похож на OpenAPI YAML`);
    process.exit(1);
  }
  return body;
}

async function main() {
  const [authBody, familyBody] = await Promise.all([
    fetchSpec('auth', defaultAuthRaw),
    fetchSpec('family', defaultFamilyRaw),
  ]);

  writeFileSync(authOut, authBody, 'utf8');
  writeFileSync(familyOut, familyBody, 'utf8');
  console.log(`contracts:sync: записано ${authOut}`);
  console.log(`contracts:sync: записано ${familyOut}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
