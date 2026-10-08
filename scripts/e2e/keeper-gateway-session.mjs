/**
 * Keeper family access JWT for compose recovery approve (gateway /v1/recovery-requests/*).
 */
import { fetchOnboardingOtp } from './fetch-onboarding-otp.mjs';
import { loadEnvLocal } from './load-env-local.mjs';
import { normalizeRuPhoneE164 } from './phone-e164.mjs';

const KEEPER_DEVICE_ID = 'e2e-recovery-keeper-device';

/**
 * @param {string} e164
 * @returns {string}
 */
function phoneDigitsFromE164(e164) {
  const digits = e164.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('7')) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * @param {string} url
 * @param {Record<string, unknown>} body
 * @param {Record<string, string>} [headers]
 */
async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`keeper gateway POST ${url}: HTTP ${res.status} ${JSON.stringify(data).slice(0, 240)}`);
  }
  return data;
}

/**
 * Full workspace sign-in (phone + device SMS) for compose keeper device id.
 *
 * @param {string} gatewayUrl
 * @param {string} workspaceEmail
 * @param {string} password
 * @param {string} phoneE164
 * @param {string} deviceId
 * @returns {Promise<string>} family access JWT
 */
async function completeKeeperFullSignIn(gatewayUrl, workspaceEmail, password, phoneE164, deviceId) {
  const phoneDigits = phoneDigitsFromE164(phoneE164);
  const base = `${gatewayUrl}/v2/auth/workspace/sign-in`;

  const start = await postJson(base, {
    workspaceEmail,
    password,
    deviceId,
  });

  if (start.session?.families?.[0]?.access) {
    return start.session.families[0].access;
  }

  const challengeId = start.challengeId;
  if (!challengeId || start.flow !== 'full') {
    throw new Error('keeper workspace sign-in: expected full flow with challengeId');
  }

  await postJson(`${base}/request-otp`, { challengeId, phone: phoneE164 });
  const phoneOtp = await fetchOnboardingOtp({
    channel: 'sms',
    to: phoneDigits,
    skipPriorMatches: 0,
  });
  await postJson(`${base}/verify-phone`, { challengeId, phone: phoneE164, code: phoneOtp });

  await postJson(`${base}/request-sms`, { challengeId, deviceId, phone: phoneE164 });
  const deviceOtp = await fetchOnboardingOtp({
    channel: 'sms',
    to: phoneDigits,
    skipPriorMatches: 0,
  });
  const verified = await postJson(`${base}/verify-sms`, {
    challengeId,
    deviceId,
    phone: phoneE164,
    code: deviceOtp,
  });
  const deviceSession = verified.deviceSession;
  if (!deviceSession) {
    throw new Error('keeper workspace sign-in: verify-sms returned no deviceSession');
  }

  const completed = await postJson(
    `${base}/complete`,
    { challengeId, password, deviceId },
    { 'X-Device-Session': deviceSession, 'X-Device-Id': deviceId },
  );
  const access = completed.session?.families?.[0]?.access;
  if (!access) {
    throw new Error('keeper workspace sign-in: complete returned no families[0].access');
  }
  return access;
}

/**
 * @param {{ workspaceEmail?: string; password?: string; phoneDigits?: string }} [override] Cypress fixture (not logged)
 * @returns {Promise<string>} Bearer token (family access JWT)
 */
export async function getKeeperAccessToken(override) {
  loadEnvLocal();

  const direct = process.env.E2E_RECOVERY_KEEPER_ACCESS_TOKEN?.trim();
  if (direct) return direct;

  const password = override?.password?.trim() || process.env.E2E_RECOVERY_KEEPER_PASSWORD?.trim();
  const workspaceEmail =
    override?.workspaceEmail?.trim() ||
    process.env.E2E_RECOVERY_KEEPER_WORKSPACE_EMAIL?.trim() ||
    process.env.E2E_RECOVERY_KEEPER_EMAIL?.trim();
  if (!workspaceEmail || !password) {
    throw new Error(
      'Set E2E_RECOVERY_KEEPER_ACCESS_TOKEN or ' +
        'E2E_RECOVERY_KEEPER_WORKSPACE_EMAIL + E2E_RECOVERY_KEEPER_PASSWORD ' +
        '(keeper workspace shortcut sign-in on compose).',
    );
  }
  if (!workspaceEmail.includes('@workspaces.')) {
    throw new Error(
      'Keeper approve needs a workspace email (@workspaces.*) or E2E_RECOVERY_KEEPER_ACCESS_TOKEN. ' +
        'Personal email OTP sign-in is not implemented in this helper.',
    );
  }

  const gatewayUrl = process.env.GATEWAY_URL?.replace(/\/$/, '');
  if (!gatewayUrl) {
    throw new Error('GATEWAY_URL is not set');
  }

  const deviceId = process.env.E2E_RECOVERY_KEEPER_DEVICE_ID?.trim() || KEEPER_DEVICE_ID;
  const phoneRaw =
    override?.phoneDigits?.trim() ||
    process.env.CYPRESS_RECOVERY_PHONE_DIGITS?.trim() ||
    '';
  const phoneE164 = normalizeRuPhoneE164(phoneRaw);
  if (!phoneE164) {
    throw new Error(
      'keeper full sign-in needs member phoneDigits (Cypress fixture or CYPRESS_RECOVERY_PHONE_DIGITS)',
    );
  }

  const res = await fetch(`${gatewayUrl}/v2/auth/workspace/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceEmail,
      password,
      deviceId,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `keeper workspace sign-in failed: HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`,
    );
  }

  const session = body.session;
  const access = session?.families?.[0]?.access;
  if (typeof access === 'string' && access) {
    return access;
  }

  if (body.flow === 'full') {
    return completeKeeperFullSignIn(gatewayUrl, workspaceEmail, password, phoneE164, deviceId);
  }

  throw new Error('keeper workspace sign-in: no session.families[0].access in response');
}
