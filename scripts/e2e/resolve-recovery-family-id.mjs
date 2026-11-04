import { getKeeperAccessToken } from './keeper-gateway-session.mjs';
import { loadEnvLocal } from './load-env-local.mjs';

/**
 * @param {string} raw
 * @returns {string}
 */
export function normalizeRecoveryFamilySlug(raw) {
  const trimmed = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (!trimmed) return '';
  const at = trimmed.indexOf('@');
  return at === -1 ? trimmed : trimmed.slice(0, at);
}

/**
 * @param {unknown} family
 * @param {string} slug
 */
function familyMatchesSlug(family, slug) {
  if (!family || typeof family !== 'object') return false;
  const item = /** @type {Record<string, unknown>} */ (family);
  if (item.workspace_slug === slug) return true;
  const email = item.workspace_email;
  if (typeof email === 'string' && email.toLowerCase().startsWith(`${slug}@`)) {
    return true;
  }
  return false;
}

/**
 * Resolve auth/family UUID for a workspace slug (keeper token scopes the list).
 *
 * @param {{ familySlug: string; keeper?: { workspaceEmail?: string; password?: string }; phoneDigits: string }} args
 * @returns {Promise<string>}
 */
export async function resolveFamilyIdBySlug(args) {
  loadEnvLocal();
  const slug = normalizeRecoveryFamilySlug(args.familySlug);
  if (!slug) {
    throw new Error('resolveFamilyIdBySlug: familySlug required');
  }

  const gatewayUrl = process.env.GATEWAY_URL?.replace(/\/$/, '');
  if (!gatewayUrl) {
    throw new Error('GATEWAY_URL is not set');
  }

  const access = await getKeeperAccessToken({
    ...args.keeper,
    phoneDigits: args.phoneDigits,
  });

  const res = await fetch(`${gatewayUrl}/v1/user/families?limit=24`, {
    headers: { Authorization: `Bearer ${access}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`resolveFamilyIdBySlug: list families HTTP ${res.status}`);
  }

  const items = Array.isArray(data.items) ? data.items : [];
  const match = items.find((f) => familyMatchesSlug(f, slug));
  if (!match?.id || typeof match.id !== 'string') {
    throw new Error(`resolveFamilyIdBySlug: no family for slug "${slug}"`);
  }
  return match.id;
}

/**
 * @param {{ familySlug?: string; keeper?: { workspaceEmail?: string }; phoneDigits: string }} args
 * @returns {Promise<string | undefined>}
 */
export async function resolveFamilyIdForRecovery(args) {
  let slug = normalizeRecoveryFamilySlug(args.familySlug);
  if (!slug && args.keeper?.workspaceEmail) {
    slug = normalizeRecoveryFamilySlug(args.keeper.workspaceEmail);
  }
  if (!slug) {
    const fromEnv = normalizeRecoveryFamilySlug(process.env.CYPRESS_RECOVERY_WORKSPACE_EMAIL);
    if (fromEnv) slug = fromEnv;
  }
  if (!slug) return undefined;
  return resolveFamilyIdBySlug({
    familySlug: slug,
    keeper: args.keeper,
    phoneDigits: args.phoneDigits,
  });
}
