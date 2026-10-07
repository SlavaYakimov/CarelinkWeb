#!/usr/bin/env node
/**
 * Cypress task helper: resolve pending request id + keeper approve.
 * Usage: node approve-recovery-compose.mjs <phoneDigits>
 * Prints requestId to stdout.
 */
import { approveRecoveryRequest } from './approve-recovery-request.mjs';
import { fetchPendingRecoveryRequestId } from './fetch-pending-recovery-request-id.mjs';

/**
 * @param {string} phoneDigits
 * @returns {Promise<string>} requestId
 */
export async function approveRecoveryCompose(phoneDigits) {
  const requestId = await fetchPendingRecoveryRequestId();
  await approveRecoveryRequest({ requestId, phone: phoneDigits });
  return requestId;
}

const isMain = process.argv[1]?.endsWith('approve-recovery-compose.mjs');
if (isMain) {
  const phone = process.argv[2];
  if (!phone) {
    console.error('Usage: approve-recovery-compose.mjs <phoneDigits>');
    process.exit(1);
  }
  approveRecoveryCompose(phone)
    .then((id) => {
      process.stdout.write(id);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}
