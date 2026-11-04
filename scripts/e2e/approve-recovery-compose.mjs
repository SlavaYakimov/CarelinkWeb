#!/usr/bin/env node
/**
 * Cypress task helper: resolve pending request id + keeper approve + recovery SMS OTP.
 * Usage: node approve-recovery-compose.mjs <phoneDigits> [familySlug]
 * Prints JSON { requestId, smsCode } to stdout.
 */
import { approveRecoveryRequest } from './approve-recovery-request.mjs';
import { countRecipientSmsInLogs, fetchOnboardingOtp } from './fetch-onboarding-otp.mjs';
import { fetchPendingRecoveryRequestId } from './fetch-pending-recovery-request-id.mjs';

const RECOVERY_SMS_BODY_NEEDLE = 'восстановлен';

/**
 * @param {string} phoneDigits
 * @param {{ workspaceEmail: string; password: string }} [keeper]
 * @param {{ familySlug?: string }} [options]
 * @returns {Promise<{ requestId: string; smsCode: string }>}
 */
export async function approveRecoveryCompose(phoneDigits, keeper, options = {}) {
  const smsBefore = await countRecipientSmsInLogs(phoneDigits, {
    bodyIncludes: RECOVERY_SMS_BODY_NEEDLE,
  });
  const requestId = await fetchPendingRecoveryRequestId({
    phoneDigits,
    familySlug: options.familySlug,
    keeper,
  });
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
  const familySlug = process.argv[3];
  if (!phone) {
    console.error('Usage: approve-recovery-compose.mjs <phoneDigits> [familySlug]');
    process.exit(1);
  }
  const keeper =
    process.env.E2E_RECOVERY_KEEPER_WORKSPACE_EMAIL && process.env.E2E_RECOVERY_KEEPER_PASSWORD
      ? {
          workspaceEmail: process.env.E2E_RECOVERY_KEEPER_WORKSPACE_EMAIL,
          password: process.env.E2E_RECOVERY_KEEPER_PASSWORD,
        }
      : undefined;
  approveRecoveryCompose(phone, keeper, { familySlug })
    .then((payload) => {
      process.stdout.write(JSON.stringify(payload));
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}
