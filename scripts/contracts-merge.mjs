#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dumpYaml, mergeOpenApiDocuments, parseYaml } from './contracts-openapi-utils.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const authPath = join(root, 'contracts', 'auth.openapi.yaml');
const familyPath = join(root, 'contracts', 'family.openapi.yaml');
const outPath = join(root, 'contracts', 'gateway.openapi.yaml');

const authDoc = parseYaml(readFileSync(authPath, 'utf8'));
const familyDoc = parseYaml(readFileSync(familyPath, 'utf8'));
const merged = mergeOpenApiDocuments(authDoc, familyDoc);
writeFileSync(outPath, dumpYaml(merged), 'utf8');
console.log(`contracts:merge: wrote ${outPath}`);
