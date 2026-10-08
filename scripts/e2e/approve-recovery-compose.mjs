#!/usr/bin/env node
/**
 * Cypress task helper: resolve pending request id + keeper approve + recovery SMS OTP.
 * Usage: node approve-recovery-compose.mjs <phoneDigits>
 * Prints JSON { requestId, smsCode } to stdout.
 */
import { approveRecoveryRequest } from './approve-recovery-request.mjs';
import { countRecipientSmsInLogs, fetchOnboardingOtp } from './fetch-onboarding-otp.mjs';
import { fetchPendingRecoveryRequestId } from './fetch-pending-recovery-request-id.mjs';

/**
 * @param {string} phoneDigits
 * @param {{ workspaceEmail: string; password: string }} [keeper]
 * @returns {Promise<{ requestId: string; smsCode: string }>}
 */
const RECOVERY_SMS_BODY_NEEDLE = 'восстановлен';

export async function approveRecoveryCompose(phoneDigits, keeper) {
  const smsBefore = await countRecipientSmsInLogs(phoneDigits, {
    bodyIncludes: RECOVERY_SMS_BODY_NEEDLE,
  });
  const requestId = await fetchPendingRecoveryRequestId();
  await approveRecoveryRequest({ requestId, phone: phoneDigits, keeper });
  const smsCode = await fetchOnboardingOtp({
    channel: 'sms',
    to: phoneDigits,
    bodyIncludes: RECOVERY_SMS_BODY_NEEDLE,
    skipPriorMatches: 0,
    minRecipientMatches: smsBefore + 1,
  });
  return { requestId, smsCode };
}

const isMain = process.argv[1]?.endsWith('approve-recovery-compose.mjs');
if (isMain) {
  const phone = process.argv[2];
  if (!phone) {
    console.error('Usage: approve-recovery-compose.mjs <phoneDigits>');
    process.exit(1);
  }
  const keeper =
    process.env.E2E_RECOVERY_KEEPER_WORKSPACE_EMAIL && process.env.E2E_RECOVERY_KEEPER_PASSWORD
      ? {
          workspaceEmail: process.env.E2E_RECOVERY_KEEPER_WORKSPACE_EMAIL,
          password: process.env.E2E_RECOVERY_KEEPER_PASSWORD,
        }
      : undefined;
  approveRecoveryCompose(phone, keeper)
    .then((payload) => {
      process.stdout.write(JSON.stringify(payload));
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}
