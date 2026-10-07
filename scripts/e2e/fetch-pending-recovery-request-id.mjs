#!/usr/bin/env node
/**
 * Latest pending recovery_requests.id from CarelinkAuth compose auth Postgres.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { composePostgresExecArgv } from './carelink-auth-compose.mjs';
import { loadEnvLocal } from './load-env-local.mjs';

const execFileAsync = promisify(execFile);

const POLL_RETRIES = 8;
const POLL_INTERVAL_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const PENDING_SQL =
  "SELECT id FROM recovery_requests WHERE status = 'pending' ORDER BY last_requested_at DESC LIMIT 1";

/**
 * @returns {Promise<string>}
 */
export async function fetchPendingRecoveryRequestId() {
  loadEnvLocal();
  const argv = composePostgresExecArgv([
    'psql',
    '-U',
    'carelink',
    '-d',
    'auth',
    '-t',
    '-A',
    '-c',
    PENDING_SQL,
  ]);

  let lastError;
  for (let attempt = 0; attempt < POLL_RETRIES; attempt += 1) {
    try {
      const { stdout } = await execFileAsync('docker', argv, { env: process.env });
      const id = stdout.trim();
      if (id) return id;
      lastError = new Error('no pending recovery_requests row');
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    if (attempt < POLL_RETRIES - 1) {
      await sleep(POLL_INTERVAL_MS);
    }
  }

  throw new Error(
    `fetch-pending-recovery-request-id: no pending request after ${POLL_RETRIES} attempts. ` +
      'Submit recovery request in the UI first. ' +
      (lastError instanceof Error ? lastError.message : ''),
  );
}

const isMain = process.argv[1]?.endsWith('fetch-pending-recovery-request-id.mjs');
if (isMain) {
  fetchPendingRecoveryRequestId()
    .then((id) => {
      process.stdout.write(id);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}
