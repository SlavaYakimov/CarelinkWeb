#!/usr/bin/env node
/**
 * Preflight for compose-backed Cypress E2E (CarelinkAuth BE-21 + local gateway).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { assertCarelinkAuthRoot, resolveCarelinkAuthRoot } from './e2e/carelink-auth-compose.mjs';

const exec = promisify(execFile);

const required = ['APP_ENV', 'APP_ORIGIN', 'GATEWAY_URL', 'REDIS_URL', 'SESSION_ENC_KEY'];
const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length > 0) {
  console.error(
    'E2E compose: missing environment variables:\n' + missing.map((k) => `  ${k}`).join('\n'),
  );
  process.exit(1);
}

const gatewayUrl = process.env.GATEWAY_URL.replace(/\/$/, '');
const healthz = `${gatewayUrl}/healthz`;

try {
  const { stdout } = await exec('curl', ['-sf', '--max-time', '5', healthz], { env: process.env });
  if (!stdout.trim()) {
    console.error(`E2E compose: gateway healthz empty at ${healthz}`);
    process.exit(1);
  }
} catch {
  console.error(
    `E2E compose: gateway not reachable at ${healthz}. ` +
      'Run: cd ../CarelinkAuth && make compose-web-e2e-up',
  );
  process.exit(1);
}

const authRoot = resolveCarelinkAuthRoot();
try {
  assertCarelinkAuthRoot(authRoot);
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
}

try {
  await exec('docker', ['info'], { env: process.env });
} catch {
  console.error('E2E compose: Docker daemon not running (needed for OTP logs).');
  process.exit(1);
}

console.log(`E2E compose env OK (gateway ${healthz}, CarelinkAuth at ${authRoot})`);
