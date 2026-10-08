#!/usr/bin/env node
/**
 * Preflight for compose-backed Cypress E2E (CarelinkAuth BE-21 + local gateway).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { assertCarelinkAuthRoot, resolveCarelinkAuthRoot } from './e2e/carelink-auth-compose.mjs';
import { loadEnvLocal } from './e2e/load-env-local.mjs';

const exec = promisify(execFile);

loadEnvLocal();

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

const recoveryProbeUrl = `${gatewayUrl}/v2/auth/recovery/request`;
const recoveryProbeBody = JSON.stringify({
  familySlug: 'e2echeck',
  phone: '+79000000000',
});

try {
  const { stdout } = await exec(
    'curl',
    [
      '-s',
      '-w',
      '\n%{http_code}',
      '--max-time',
      '10',
      '-X',
      'POST',
      recoveryProbeUrl,
      '-H',
      'Content-Type: application/json',
      '-H',
      'X-Device-Id: e2e-recovery-probe',
      '-d',
      recoveryProbeBody,
    ],
    { env: process.env },
  );
  const trimmed = stdout.trimEnd();
  const lastNewline = trimmed.lastIndexOf('\n');
  const body = lastNewline >= 0 ? trimmed.slice(0, lastNewline) : trimmed;
  const statusRaw = lastNewline >= 0 ? trimmed.slice(lastNewline + 1) : '';
  const status = Number.parseInt(statusRaw, 10);
  if (status === 501 || body.includes('NOT_IMPLEMENTED')) {
    console.error(
      'E2E compose: recovery is disabled on gateway (501 NOT_IMPLEMENTED). ' +
        'Run: cd ../CarelinkAuth && make compose-web-e2e-up',
    );
    process.exit(1);
  }
} catch {
  console.error(
    `E2E compose: recovery probe failed at ${recoveryProbeUrl}. ` +
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
