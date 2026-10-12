#!/usr/bin/env node
/**
 * Poll compose gateway + family-service (via gateway) until ready after family-service recreate.
 */
import { loadEnvLocal } from './load-env-local.mjs';
import { lookupInviteEmail } from './invites-gateway.mjs';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} gatewayUrl
 */
async function waitGatewayHealthz(gatewayUrl) {
  const url = `${gatewayUrl.replace(/\/$/, '')}/healthz`;
  let lastError = 'unknown';
  for (let attempt = 0; attempt < 90; attempt += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(4_000) });
      if (res.ok) return;
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await sleep(1_000);
  }
  throw new Error(`gateway healthz not ready: ${lastError}`);
}

/**
 * @param {{ gatewayUrl: string; familyId: string; access: string; email?: string }} probe
 */
async function waitFamilyInvitePathReady(probe) {
  const email = probe.email?.trim() || `e2e.health.${Date.now()}@example.com`;
  let lastStatus = 0;
  let lastCode = '';
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const lookup = await lookupInviteEmail(probe.gatewayUrl, probe.familyId, probe.access, email);
    lastStatus = lookup.status;
    lastCode = lookup.data?.code ?? '';
    if (lookup.status === 200 || lookup.status === 501 || lookup.status === 403) {
      return;
    }
    if (lookup.status !== 502 && lookup.status !== 503 && lookup.status !== 504) {
      return;
    }
    await sleep(1_000);
  }
  throw new Error(
    `family invite path not ready (lookup ${lastStatus}, code=${lastCode || 'n/a'})`,
  );
}

/**
 * @param {{ keeper?: { workspaceEmail: string; password: string; phoneDigits: string }; email?: string }} [opts]
 */
export async function waitComposeGatewayAndFamilyReady(opts = {}) {
  loadEnvLocal();
  const gatewayUrl = process.env.GATEWAY_URL?.replace(/\/$/, '');
  if (!gatewayUrl) throw new Error('GATEWAY_URL is not set');

  await waitGatewayHealthz(gatewayUrl);

  if (opts.keeper) {
    const { resolveKeeperGatewayContext } = await import('./invites-gateway.mjs');
    const ctx = await resolveKeeperGatewayContext(opts.keeper);
    await waitFamilyInvitePathReady({
      gatewayUrl: ctx.gatewayUrl,
      familyId: ctx.familyId,
      access: ctx.access,
      email: opts.email,
    });
  }

  return { ok: true };
}
