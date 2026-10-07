#!/usr/bin/env node
/**
 * Keeper approves a pending recovery request (compose BE-21).
 * Usage: node approve-recovery-request.mjs <requestId> <phoneDigitsOrE164>
 */
import { getKeeperAccessToken } from './keeper-gateway-session.mjs';
import { normalizeRuPhoneE164 } from './phone-e164.mjs';
import { loadEnvLocal } from './load-env-local.mjs';

/**
 * @param {{ requestId: string; phone: string }} args
 * @returns {Promise<void>}
 */
export async function approveRecoveryRequest(args) {
  loadEnvLocal();
  const gatewayUrl = process.env.GATEWAY_URL?.replace(/\/$/, '');
  if (!gatewayUrl) {
    throw new Error('GATEWAY_URL is not set');
  }

  const phoneE164 = normalizeRuPhoneE164(args.phone);
  if (!phoneE164) {
    throw new Error('approve-recovery-request: invalid phone');
  }

  const token = await getKeeperAccessToken();
  const res = await fetch(`${gatewayUrl}/v1/recovery-requests/${args.requestId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ phone: phoneE164 }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`approve recovery failed: HTTP ${res.status} ${text.slice(0, 300)}`);
  }
}

const isMain = process.argv[1]?.endsWith('approve-recovery-request.mjs');
if (isMain) {
  const requestId = process.argv[2];
  const phone = process.argv[3];
  if (!requestId || !phone) {
    console.error('Usage: approve-recovery-request.mjs <requestId> <phone>');
    process.exit(1);
  }
  approveRecoveryRequest({ requestId, phone })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}
