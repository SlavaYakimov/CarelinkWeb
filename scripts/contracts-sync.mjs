#!/usr/bin/env node
/**
 * Pulls auth OpenAPI from CarelinkAuth (private repo) → contracts/auth.openapi.yaml.
 *
 * Family member-invite / role-template routes: **not** synced — CarelinkAuth
 * `docs/backend/family/openapi.yaml` is too sparse; `contracts/family.openapi.yaml`
 * in this repo is the source of truth until BE moves full schemas to the server doc.
 * TODO(BE-20): replace family.openapi.yaml vendoring with upstream sync once complete.
 *
 * Set GITHUB_TOKEN (or CONTRACTS_SYNC_TOKEN) for GitHub API raw fetch.
 * Optional: CONTRACTS_SYNC_AUTH_URL, CONTRACTS_SYNC_REF (default main).
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dumpYaml, parseYaml } from './contracts-openapi-utils.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const authOut = join(root, 'contracts', 'auth.openapi.yaml');

const repo = process.env.CONTRACTS_SYNC_REPO ?? 'SlavaYakimov/CarelinkAuth';
const ref = process.env.CONTRACTS_SYNC_REF ?? 'main';
const authPath = process.env.CONTRACTS_SYNC_AUTH_PATH ?? 'docs/backend/auth/openapi.yaml';

const defaultAuthRaw = `https://raw.githubusercontent.com/${repo}/${ref}/${authPath}`;

/** CarelinkAuth OpenAPI still documents 4-digit OTP; e2e and staging use 6 digits (doc bug). */
function patchWorkspaceVerifyPhoneCodeLength(authDoc) {
  const schema = authDoc.components?.schemas?.WorkspaceSignInVerifyPhoneRequest;
  if (!schema?.properties?.code || typeof schema.properties.code !== 'object') {
    return authDoc;
  }
  const code = schema.properties.code;
  code.minLength = 6;
  code.maxLength = 6;
  if (code.example === '1234') {
    delete code.example;
  }
  return authDoc;
}

async function fetchAuthSpec() {
  const token = process.env.CONTRACTS_SYNC_TOKEN ?? process.env.GITHUB_TOKEN;
  const resolvedUrl = process.env.CONTRACTS_SYNC_AUTH_URL ?? process.env.CONTRACTS_SYNC_URL ?? defaultAuthRaw;

  if (!token && resolvedUrl.includes('raw.githubusercontent.com')) {
    console.error(
      'contracts:sync: нужен GITHUB_TOKEN / CONTRACTS_SYNC_TOKEN (приватный CarelinkAuth) или CONTRACTS_SYNC_AUTH_URL.',
    );
    process.exit(1);
  }

  const headers = { Accept: 'application/vnd.github.raw' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(resolvedUrl, { headers });
  if (!res.ok) {
    console.error(`contracts:sync: HTTP ${res.status} ${res.statusText} для auth (${resolvedUrl})`);
    process.exit(1);
  }

  const body = await res.text();
  if (!body.includes('openapi:')) {
    console.error('contracts:sync: ответ auth не похож на OpenAPI YAML');
    process.exit(1);
  }
  return body;
}

async function main() {
  const authBody = await fetchAuthSpec();
  let authDoc = parseYaml(authBody);
  authDoc = patchWorkspaceVerifyPhoneCodeLength(authDoc);
  writeFileSync(authOut, dumpYaml(authDoc), 'utf8');
  console.log(`contracts:sync: записано ${authOut}`);
  console.log(
    'contracts:sync: contracts/family.openapi.yaml не обновлялся (web — source of truth для invites; см. TODO BE-20).',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
