#!/usr/bin/env node
/**
 * One-shot helper: split hand-merged gateway YAML into auth (main + session/rebuild) + family invites.
 * Usage: node scripts/contracts-materialize-from-legacy.mjs [path-to-combined.yaml]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  authDocWithSessionRebuild,
  dumpYaml,
  extractFamilyInviteSpec,
  parseYaml,
} from './contracts-openapi-utils.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const combinedPath = process.argv[2] ?? join(root, 'contracts', 'auth.openapi.yaml');
const mainAuthYaml = execSync('git show origin/main:contracts/auth.openapi.yaml', {
  cwd: root,
  encoding: 'utf8',
});

const combined = parseYaml(readFileSync(combinedPath, 'utf8'));
const mainAuth = parseYaml(mainAuthYaml);

const authDoc = authDocWithSessionRebuild(mainAuth, combined);
const familyDoc = extractFamilyInviteSpec(combined);

writeFileSync(join(root, 'contracts', 'auth.openapi.yaml'), dumpYaml(authDoc), 'utf8');
writeFileSync(join(root, 'contracts', 'family.openapi.yaml'), dumpYaml(familyDoc), 'utf8');
console.log(
  'contracts:materialize: wrote contracts/auth.openapi.yaml and contracts/family.openapi.yaml',
);
