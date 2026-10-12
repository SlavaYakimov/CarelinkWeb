/**
 * Gateway helpers for member-invites compose E2E (127.0.0.1:8088).
 */
import { randomUUID } from 'node:crypto';
import { getKeeperAccessToken } from './keeper-gateway-session.mjs';
import { loadEnvLocal } from './load-env-local.mjs';
import { normalizeRuPhoneE164 } from './phone-e164.mjs';

/**
 * @param {string} url
 * @param {RequestInit & { json?: unknown }} init
 */
async function requestJson(url, init = {}) {
  const headers = { Accept: 'application/json', ...(init.headers ?? {}) };
  let body;
  if (init.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.json);
  }
  const res = await fetch(url, {
    method: init.method ?? 'GET',
    headers,
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { res, data };
}

/**
 * @param {{ workspaceEmail: string; password: string; phoneDigits: string }} keeper
 */
export async function resolveKeeperGatewayContext(keeper) {
  loadEnvLocal();
  const gatewayUrl = process.env.GATEWAY_URL?.replace(/\/$/, '');
  if (!gatewayUrl) throw new Error('GATEWAY_URL is not set');

  const access = await getKeeperAccessToken({
    workspaceEmail: keeper.workspaceEmail,
    password: keeper.password,
    phoneDigits: keeper.phoneDigits,
  });

  const { res, data } = await requestJson(`${gatewayUrl}/v1/user/families?limit=24`, {
    headers: { Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    throw new Error(`list families: HTTP ${res.status} ${JSON.stringify(data).slice(0, 200)}`);
  }
  const items = data.items ?? [];
  const family =
    items.find((f) => f.role === 'keeper' || f.isOwner === true) ??
    items.find((f) => f.workspace_email === keeper.workspaceEmail) ??
    items[0];
  if (!family?.id) {
    throw new Error('resolveKeeperGatewayContext: no family in list');
  }

  const roles = await listRoleTemplates(gatewayUrl, family.id, access);
  const roleTemplateId = roles[0]?.id;
  if (!roleTemplateId) {
    throw new Error('resolveKeeperGatewayContext: no role templates');
  }

  return {
    gatewayUrl,
    access,
    familyId: family.id,
    familyName: family.name,
    roleTemplateId,
  };
}

/**
 * @param {string} gatewayUrl
 * @param {string} familyId
 * @param {string} access
 */
export async function listRoleTemplates(gatewayUrl, familyId, access) {
  const { res, data } = await requestJson(`${gatewayUrl}/v1/families/${familyId}/role-templates`, {
    headers: { Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    throw new Error(`role-templates: HTTP ${res.status}`);
  }
  return data.items ?? [];
}

/**
 * @param {string} gatewayUrl
 * @param {string} familyId
 * @param {string} access
 * @param {string} email
 */
/**
 * @param {string} gatewayUrl
 * @param {string} familyId
 * @param {string} access
 * @param {string} email
 * @param {{ clientIp?: string }} [opts]
 */
export async function lookupInviteEmail(gatewayUrl, familyId, access, email, opts = {}) {
  const headers = { Authorization: `Bearer ${access}` };
  const clientIp = opts.clientIp?.trim();
  if (clientIp) {
    headers['X-Forwarded-For'] = clientIp;
    headers['X-Real-IP'] = clientIp;
  }
  const { res, data } = await requestJson(
    `${gatewayUrl}/v1/families/${familyId}/member-invites/lookup-email`,
    {
      method: 'POST',
      headers,
      json: { email },
    },
  );
  return { status: res.status, data, retryAfter: res.headers.get('retry-after') };
}

/**
 * @param {object} params
 */
export async function createMemberInviteGateway(params) {
  const { gatewayUrl, familyId, access, body } = params;
  const { res, data } = await requestJson(`${gatewayUrl}/v1/families/${familyId}/member-invites`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'Idempotency-Key': randomUUID() },
    json: body,
  });
  return { status: res.status, data };
}

/**
 * @param {object} params
 */
export async function acceptMemberInviteGateway(params) {
  const { gatewayUrl, access, inviteId } = params;
  const { res, data } = await requestJson(
    `${gatewayUrl}/v1/user/member-invites/${inviteId}/accept`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}` },
      json: {},
    },
  );
  return { status: res.status, data };
}

/**
 * @param {object} params
 */
export async function listPendingInvitesGateway(params) {
  const { gatewayUrl, access } = params;
  const { res, data } = await requestJson(`${gatewayUrl}/v1/user/member-invites/pending`, {
    headers: { Authorization: `Bearer ${access}` },
  });
  return { status: res.status, data };
}

/**
 * @param {object} params
 */
export async function resendInviteGateway(params) {
  const { gatewayUrl, familyId, access, inviteId } = params;
  const { res, data } = await requestJson(
    `${gatewayUrl}/v1/families/${familyId}/member-invites/${inviteId}/resend`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}` },
      json: {},
    },
  );
  return { status: res.status, data };
}

/**
 * @param {object} params
 */
export async function revokeInviteGateway(params) {
  const { gatewayUrl, familyId, access, inviteId } = params;
  const { res, data } = await requestJson(
    `${gatewayUrl}/v1/families/${familyId}/member-invites/${inviteId}/revoke`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}` },
      json: {},
    },
  );
  return { status: res.status, data };
}

/**
 * @param {string} phoneDigits
 */
export function phoneE164FromDigits(phoneDigits) {
  const e164 = normalizeRuPhoneE164(phoneDigits);
  if (!e164) throw new Error(`invalid phone digits: ${phoneDigits}`);
  return e164;
}
