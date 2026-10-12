#!/usr/bin/env node
/**
 * Compose fixtures for invites E2E matrix (gateway + optional family DB).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { composeFamilyPostgresExecArgv } from './carelink-auth-compose.mjs';
import {
  acceptMemberInviteGateway,
  createMemberInviteGateway,
  lookupInviteEmail,
  phoneE164FromDigits,
  resolveKeeperGatewayContext,
  revokeInviteGateway,
} from './invites-gateway.mjs';
import { loadEnvLocal } from './load-env-local.mjs';

const execFileAsync = promisify(execFile);

/**
 * @param {string} sql
 */
async function execFamilySql(sql) {
  loadEnvLocal();
  const database = process.env.E2E_FAMILY_DATABASE?.trim() || 'family';
  const argv = composeFamilyPostgresExecArgv([
    'psql',
    '-U',
    'carelink',
    '-d',
    database,
    '-t',
    '-A',
    '-c',
    sql,
  ]);

  const { stdout } = await execFileAsync('docker', argv, { env: process.env });
  return stdout.trim();
}

/**
 * @param {string} familyId
 */
function sqlFamilyIdLiteral(familyId) {
  const trimmed = String(familyId ?? '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(trimmed)) {
    throw new Error(`invalid familyId for SQL: ${trimmed.slice(0, 8)}…`);
  }
  return `'${trimmed}'::uuid`;
}

/**
 * @param {{ keeper: object; inviteeEmail: string; inviteePhoneDigits: string; displayName?: string }} args
 */
export async function seedPendingExistingInvite(args) {
  const ctx = await resolveKeeperGatewayContext(args.keeper);
  const phone = phoneE164FromDigits(args.inviteePhoneDigits);
  const created = await createMemberInviteGateway({
    gatewayUrl: ctx.gatewayUrl,
    familyId: ctx.familyId,
    access: ctx.access,
    body: {
      roleTemplateId: ctx.roleTemplateId,
      displayName: args.displayName ?? 'E2E Invitee',
      phone,
      personalEmail: args.inviteeEmail,
    },
  });
  if (created.status !== 201) {
    throw new Error(`create invite failed: ${created.status} ${JSON.stringify(created.data)}`);
  }
  return {
    ...ctx,
    inviteId: created.data.inviteId,
    inviteeKind: created.data.inviteeKind,
  };
}

/**
 * @param {{ inviteId: string }} args
 */
export async function expireMemberInvite(args) {
  const sql = `UPDATE member_invites SET expires_at = NOW() - INTERVAL '1 day', status = 'expired' WHERE id = '${args.inviteId}'`;
  try {
    await execFamilySql(sql);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * @param {{ familyId: string; enabled: boolean }} args
 */
export async function setFamilyMemberInvitesEnabled(args) {
  const flag = args.enabled ? 'TRUE' : 'FALSE';
  const familyLiteral = sqlFamilyIdLiteral(args.familyId);
  const sql = `UPDATE families SET workspace_member_invite_email_enabled = ${flag} WHERE id = ${familyLiteral} RETURNING workspace_member_invite_email_enabled`;
  try {
    const readback = await execFamilySql(sql);
    if (!readback) {
      return {
        ok: false,
        message:
          'UPDATE families returned no row (unknown family id or missing workspace_member_invite_email_enabled column)',
      };
    }
    const enabled = readback === 't' || readback === 'true' || readback === '1';
    if (enabled !== Boolean(args.enabled)) {
      return {
        ok: false,
        message: `workspace_member_invite_email_enabled readback mismatch: expected ${args.enabled}, got ${readback}`,
      };
    }
    return { ok: true, enabled };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * @param {{ keeper: object; familyId: string; enabled: boolean; email?: string }} args
 */
export async function setFamilyMemberInvitesEnabledAndVerify(args) {
  const flagResult = await setFamilyMemberInvitesEnabled({
    familyId: args.familyId,
    enabled: args.enabled,
  });
  if (!flagResult.ok) {
    return { ...flagResult, gatewayStatus: null };
  }

  const ctx = await resolveKeeperGatewayContext(args.keeper);
  const email = args.email?.trim() || `e2e.flag.verify.${Date.now()}@example.com`;
  const lookup = await lookupInviteEmail(ctx.gatewayUrl, args.familyId, ctx.access, email);
  const expectDisabled = !args.enabled;
  const gatewayOk = expectDisabled ? lookup.status === 501 : lookup.status === 200;
  if (!gatewayOk) {
    return {
      ok: false,
      message: expectDisabled
        ? `gateway lookup-email expected 501 after flag off, got ${lookup.status} (code=${lookup.data?.code ?? 'n/a'})`
        : `gateway lookup-email expected 200 after flag on, got ${lookup.status}`,
      gatewayStatus: lookup.status,
      gatewayCode: lookup.data?.code,
    };
  }
  return { ok: true, enabled: args.enabled, gatewayStatus: lookup.status };
}

/**
 * @param {{ gatewayUrl: string; familyId: string; access: string; count: number; email: string }} args
 */
export async function hammerLookupEmail(args) {
  let last;
  for (let i = 0; i < args.count; i += 1) {
    last = await lookupInviteEmail(
      args.gatewayUrl,
      args.familyId,
      args.access,
      `${args.email}.${i}@example.com`,
    );
    if (last.status === 429) break;
  }
  return last;
}

/**
 * @param {{ keeper: object; member: object; inviteId: string }} args
 */
export async function acceptInviteAsWrongUser(args) {
  const memberCtx = await resolveKeeperGatewayContext(args.member);
  return acceptMemberInviteGateway({
    gatewayUrl: memberCtx.gatewayUrl,
    access: memberCtx.access,
    inviteId: args.inviteId,
  });
}

/**
 * @param {{ keeper: object; inviteId: string }} args
 */
export async function revokeInviteFixture(args) {
  const ctx = await resolveKeeperGatewayContext(args.keeper);
  return revokeInviteGateway({
    gatewayUrl: ctx.gatewayUrl,
    familyId: ctx.familyId,
    access: ctx.access,
    inviteId: args.inviteId,
  });
}

/**
 * @param {{ keeper: object; email: string }} args
 */
export async function gatewayLookupSmoke(args) {
  const ctx = await resolveKeeperGatewayContext(args.keeper);
  return lookupInviteEmail(ctx.gatewayUrl, ctx.familyId, ctx.access, args.email);
}

/**
 * @param {{ member: object; familyId: string; body: object }} args
 */
export async function createInviteAsMember(args) {
  const memberCtx = await resolveKeeperGatewayContext(args.member);
  return createMemberInviteGateway({
    gatewayUrl: memberCtx.gatewayUrl,
    familyId: args.familyId,
    access: memberCtx.access,
    body: args.body,
  });
}

/**
 * @param {string} [familyId]
 */
export async function fetchMemberUserIdForFamily(familyId) {
  const sql = `SELECT user_id FROM family_members WHERE family_id = '${familyId}' AND role != 'keeper' ORDER BY created_at DESC LIMIT 1`;
  try {
    const id = await execFamilySql(sql);
    return id || null;
  } catch {
    return null;
  }
}

/**
 * CLI smoke
 */
const isMain = process.argv[1]?.endsWith('invites-compose-fixtures.mjs');
if (isMain) {
  console.log('invites-compose-fixtures: use via Cypress tasks');
}
