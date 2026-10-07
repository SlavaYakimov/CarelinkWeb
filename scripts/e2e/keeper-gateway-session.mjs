/**
 * Keeper family access JWT for compose recovery approve (gateway /v1/recovery-requests/*).
 */
import { loadEnvLocal } from './load-env-local.mjs';

const KEEPER_DEVICE_ID = 'e2e-recovery-keeper-device';

/**
 * @returns {Promise<string>} Bearer token (family access JWT)
 */
export async function getKeeperAccessToken() {
  loadEnvLocal();

  const direct = process.env.E2E_RECOVERY_KEEPER_ACCESS_TOKEN?.trim();
  if (direct) return direct;

  const password = process.env.E2E_RECOVERY_KEEPER_PASSWORD?.trim();
  const workspaceEmail =
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
    throw new Error(
      'keeper workspace sign-in requires device verification (full flow). ' +
        'Re-run once with a trusted device id or set E2E_RECOVERY_KEEPER_ACCESS_TOKEN.',
    );
  }

  throw new Error('keeper workspace sign-in: no session.families[0].access in response');
}
