#!/usr/bin/env node
/**
 * Compose fixtures for invites E2E matrix (gateway + optional family DB).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { composePostgresExecArgv } from './carelink-auth-compose.mjs';
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
  const service = process.env.E2E_FAMILY_POSTGRES_SERVICE?.trim() || 'postgres';
  const database = process.env.E2E_FAMILY_DATABASE?.trim() || 'family';
  const argv = ['compose'];
  const rootFiles = [
    'docker-compose.yml',
    'e2e/docker-compose.e2e.yml',
    'e2e/docker-compose.web.yml',
  ];
  const { resolveCarelinkAuthRoot, assertCarelinkAuthRoot } =
    await import('./carelink-auth-compose.mjs');
  const root = resolveCarelinkAuthRoot();
  assertCarelinkAuthRoot(root);
  const path = await import('node:path');
  for (const file of rootFiles) {
    argv.push('-f', path.join(root, file));
  }
  argv.push('exec', '-T', service, 'psql', '-U', 'carelink', '-d', database, '-t', '-A', '-c', sql);

  const { stdout } = await execFileAsync('docker', argv, { env: process.env });
  return stdout.trim();
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
  const flag = args.enabled ? 'true' : 'false';
  const sql = `UPDATE families SET workspace_member_invite_email_enabled = ${flag} WHERE id = '${args.familyId}'`;
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
