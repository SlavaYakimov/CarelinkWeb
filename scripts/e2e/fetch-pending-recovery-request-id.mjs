#!/usr/bin/env node
/**
 * Pending recovery_requests.id from CarelinkAuth compose auth Postgres,
 * scoped by family and/or phone (avoids cross-run global LIMIT 1 races).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { composePostgresExecArgv } from './carelink-auth-compose.mjs';
import { loadEnvLocal } from './load-env-local.mjs';
import { buildPendingRecoveryRequestSql } from './pending-recovery-request-query.mjs';
import { recoveryPhoneHashFromDigits } from './recovery-request-phone-hash.mjs';
import { resolveFamilyIdForRecovery } from './resolve-recovery-family-id.mjs';

const execFileAsync = promisify(execFile);

const POLL_RETRIES = 8;
const POLL_INTERVAL_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {{ familySlug?: string; familyId?: string; phoneDigits?: string; keeper?: { workspaceEmail?: string; password?: string } }} [scope]
 * @returns {Promise<string>}
 */
export async function fetchPendingRecoveryRequestId(scope = {}) {
  loadEnvLocal();

  /** @type {{ familyId?: string; phoneHash?: string }} */
  const criteria = {};

  if (scope.familyId?.trim()) {
    criteria.familyId = scope.familyId.trim();
  } else {
    const familyId = await resolveFamilyIdForRecovery({
      familySlug: scope.familySlug,
      keeper: scope.keeper,
      phoneDigits: scope.phoneDigits ?? '',
    });
    if (familyId) criteria.familyId = familyId;
  }

  if (scope.phoneDigits?.trim()) {
    try {
      const { phoneHash } = recoveryPhoneHashFromDigits(scope.phoneDigits.trim());
      criteria.phoneHash = phoneHash;
    } catch (err) {
      if (!criteria.familyId) {
        throw err;
      }
    }
  }

  const sql = buildPendingRecoveryRequestSql(criteria);

  const argv = composePostgresExecArgv([
    'psql',
    '-U',
    'carelink',
    '-d',
    'auth',
    '-t',
    '-A',
    '-c',
    sql,
  ]);

  let lastError;
  for (let attempt = 0; attempt < POLL_RETRIES; attempt += 1) {
    try {
      const { stdout } = await execFileAsync('docker', argv, { env: process.env });
      const id = stdout.trim();
      if (id) return id;
      lastError = new Error('no pending recovery_requests row for scoped query');
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
  const phoneDigits = process.argv[2]?.trim();
  const familySlug = process.argv[3]?.trim();
  fetchPendingRecoveryRequestId({ phoneDigits, familySlug })
    .then((id) => {
      process.stdout.write(id);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}
