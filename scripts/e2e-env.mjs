#!/usr/bin/env node
/**
 * Validates required env before E2E (local or CI). Exits 1 if misconfigured.
 */
const required = ['APP_ENV', 'APP_ORIGIN', 'GATEWAY_URL', 'REDIS_URL', 'SESSION_ENC_KEY'];

const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length > 0) {
  console.error('E2E: missing environment variables:\n' + missing.map((k) => `  ${k}`).join('\n'));
  process.exit(1);
}

console.log('E2E env OK (APP_ORIGIN, GATEWAY_URL, REDIS_URL, SESSION_ENC_KEY set)');
