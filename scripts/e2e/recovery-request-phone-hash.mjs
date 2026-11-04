import { createHmac } from 'node:crypto';
import { loadEnvLocal } from './load-env-local.mjs';
import { normalizeRuPhoneE164 } from './phone-e164.mjs';

/**
 * Pepper chain for compose auth DB phone_hash (same env as CarelinkAuth stack).
 * @returns {string}
 */
export function resolveRecoveryPhoneHashPepper() {
  loadEnvLocal();
  return (
    process.env.E2E_RECOVERY_PHONE_HASH_PEPPER?.trim() ||
    process.env.PHONE_HASH_PEPPER?.trim() ||
    process.env.OTP_PEPPER?.trim() ||
    ''
  );
}

/**
 * HMAC-SHA256 lowercase hex (auth identifier hashing for E.164 phones).
 *
 * @param {string} phoneE164
 * @param {string} pepper
 * @returns {string}
 */
export function hashRecoveryPhoneE164(phoneE164, pepper) {
  const normalized = String(phoneE164 ?? '').trim();
  const secret = String(pepper ?? '').trim();
  if (!normalized || !secret) {
    throw new Error('hashRecoveryPhoneE164: phone and pepper required');
  }
  return createHmac('sha256', secret).update(normalized).digest('hex');
}

/**
 * @param {string} phoneDigits
 * @returns {{ phoneE164: string; phoneHash: string }}
 */
export function recoveryPhoneHashFromDigits(phoneDigits) {
  const phoneE164 = normalizeRuPhoneE164(phoneDigits);
  if (!phoneE164) {
    throw new Error('recoveryPhoneHashFromDigits: invalid phoneDigits');
  }
  const pepper = resolveRecoveryPhoneHashPepper();
  if (!pepper) {
    throw new Error(
      'recovery phone filter requires PHONE_HASH_PEPPER or OTP_PEPPER (compose auth env)',
    );
  }
  return { phoneE164, phoneHash: hashRecoveryPhoneE164(phoneE164, pepper) };
}
