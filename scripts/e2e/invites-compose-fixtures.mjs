#!/usr/bin/env node
/**
 * Compose fixtures for invites E2E matrix (gateway + family DB on family-postgres).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { composeFamilyPostgresExecArgv } from './carelink-auth-compose.mjs';
import {
  recreateFamilyServiceInviteEmailEnabled,
  recreateFamilyServiceInviteEmailEnabledAndWait,
} from './family-invite-env-compose.mjs';
import { waitComposeGatewayAndFamilyReady } from './compose-health-wait.mjs';
import {
  acceptMemberInviteGateway,
  createMemberInviteGateway,
  listFamilyMemberInvitesGateway,
  listRoleTemplates,
  lookupInviteEmail,
  phoneE164FromDigits,
  resolveKeeperGatewayContext,
  resendInviteGateway,
  revokeInviteGateway,
} from './invites-gateway.mjs';
import { getKeeperAccessToken } from './keeper-gateway-session.mjs';
import { loadEnvLocal } from './load-env-local.mjs';

const execFileAsync = promisify(execFile);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** family-service DSN: postgres://family:family@family-postgres:5432/family */
const FAMILY_PG = {
  service: () => process.env.E2E_FAMILY_POSTGRES_SERVICE?.trim() || 'family-postgres',
  user: () => process.env.E2E_FAMILY_POSTGRES_USER?.trim() || 'family',
  database: () => process.env.E2E_FAMILY_DATABASE?.trim() || 'family',
};

/**
 * @param {string} sql
 */
async function execFamilySql(sql) {
  loadEnvLocal();
  const argv = composeFamilyPostgresExecArgv([
    'psql',
    '-U',
    FAMILY_PG.user(),
    '-d',
    FAMILY_PG.database(),
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
 * @param {string} inviteId
 */
function sqlInviteIdLiteral(inviteId) {
  const trimmed = String(inviteId ?? '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(trimmed)) {
    throw new Error(`invalid inviteId for SQL: ${trimmed.slice(0, 8)}…`);
  }
  return `'${trimmed}'::uuid`;
}

async function membershipsColumnExists(column) {
  try {
    const row = await execFamilySql(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'memberships' AND column_name = '${column}' LIMIT 1`,
    );
    return row === '1';
  } catch {
    return false;
  }
}

async function familyInviteFlagColumnExists() {
  try {
    const row = await execFamilySql(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'families' AND column_name = 'workspace_member_invite_email_enabled' LIMIT 1",
    );
    return row === '1';
  } catch {
    return false;
  }
}

/**
 * @param {{ familyId: string; enabled: boolean }} args
 */
async function trySqlFamilyInviteFlag(args) {
  const hasColumn = await familyInviteFlagColumnExists();
  if (!hasColumn) {
    return { ok: false, mode: 'sql', missingColumn: true };
  }
  const flag = args.enabled ? 'TRUE' : 'FALSE';
  const familyLiteral = sqlFamilyIdLiteral(args.familyId);
  const sql = `UPDATE families SET workspace_member_invite_email_enabled = ${flag} WHERE id = ${familyLiteral} RETURNING workspace_member_invite_email_enabled`;
  const readback = await execFamilySql(sql);
  if (!readback) {
    return {
      ok: false,
      mode: 'sql',
      message: 'UPDATE families returned no row for family id',
    };
  }
  const enabled = readback === 't' || readback === 'true' || readback === '1';
  if (enabled !== Boolean(args.enabled)) {
    return {
      ok: false,
      mode: 'sql',
      message: `workspace_member_invite_email_enabled readback mismatch: expected ${args.enabled}, got ${readback}`,
    };
  }
  return { ok: true, mode: 'sql', enabled: args.enabled };
}

/**
 * @param {{ familyId: string; enabled: boolean; keeper?: object; email?: string; waitHealth?: boolean }} args
 */
export async function setFamilyMemberInvitesEnabled(args) {
  const waitOpts = args.waitHealth ? { keeper: args.keeper, email: args.email } : undefined;
  const recreate = waitOpts
    ? (enabled) => recreateFamilyServiceInviteEmailEnabledAndWait(enabled, waitOpts)
    : recreateFamilyServiceInviteEmailEnabled;

  if (args.enabled) {
    const sqlResult = await trySqlFamilyInviteFlag(args);
    if (sqlResult.ok) {
      if (args.waitHealth && args.keeper) {
        await waitComposeGatewayAndFamilyReady({ keeper: args.keeper, email: args.email });
      }
      return sqlResult;
    }
    try {
      return await recreate(true);
    } catch (err) {
      return {
        ok: false,
        mode: 'env',
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const sqlResult = await trySqlFamilyInviteFlag(args);
  if (sqlResult.ok) {
    if (args.waitHealth && args.keeper) {
      await waitComposeGatewayAndFamilyReady({ keeper: args.keeper, email: args.email });
    }
    return sqlResult;
  }

  try {
    return await recreate(false);
  } catch (err) {
    return {
      ok: false,
      mode: 'env',
      message: err instanceof Error ? err.message : String(err),
    };
  }
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
  if (created.status < 200 || created.status >= 300) {
    throw new Error(`create invite failed: ${created.status} ${JSON.stringify(created.data)}`);
  }
  if (!created.data?.inviteId) {
    throw new Error(`create invite missing inviteId: ${JSON.stringify(created.data)}`);
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
  const idLiteral = sqlInviteIdLiteral(args.inviteId);
  const sql = `UPDATE member_invite_intents SET expires_at = NOW() - INTERVAL '1 day', status = 'expired' WHERE id = ${idLiteral}`;
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
 * @param {{ keeper: object; familyId: string; enabled: boolean; email?: string }} args
 */
export async function setFamilyMemberInvitesEnabledAndVerify(args) {
  const flagResult = await setFamilyMemberInvitesEnabled({
    familyId: args.familyId,
    enabled: args.enabled,
    keeper: args.keeper,
    email: args.email,
    waitHealth: Boolean(args.waitHealth ?? args.keeper),
  });
  if (!flagResult.ok) {
    return { ...flagResult, gatewayStatus: null };
  }

  const ctx = await resolveKeeperGatewayContext(args.keeper);
  const email = args.email?.trim() || `e2e.flag.verify.${Date.now()}@example.com`;
  const lookup = await lookupInviteEmail(ctx.gatewayUrl, ctx.familyId, ctx.access, email);
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
      mode: flagResult.mode,
    };
  }
  return { ok: true, enabled: args.enabled, gatewayStatus: lookup.status, mode: flagResult.mode };
}

/**
 * @param {{ gatewayUrl: string; familyId: string; access: string; count: number; email: string; clientIp?: string }} args
 */
export async function hammerLookupEmail(args) {
  const clientIp = args.clientIp?.trim() || '127.0.0.1';
  let last;
  for (let i = 0; i < args.count; i += 1) {
    last = await lookupInviteEmail(args.gatewayUrl, args.familyId, args.access, args.email, {
      clientIp,
    });
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
/**
 * Demote the family keeper to role=member while keeping workspace ownership (isOwner).
 * Used for E18 owner-not-keeper matrix.
 *
 * @param {{ familyId: string }} args
 */
export async function demoteKeeperToOwnerMember(args) {
  const familyLiteral = sqlFamilyIdLiteral(args.familyId);
  const hasIsOwner = await membershipsColumnExists('is_owner');
  const setOwner = hasIsOwner ? ', is_owner = TRUE' : '';
  const sql = `UPDATE memberships SET role = 'member'${setOwner} WHERE family_id = ${familyLiteral} AND role = 'keeper' RETURNING user_id`;
  const userId = await execFamilySql(sql);
  if (!userId) {
    return { ok: false, message: 'no keeper membership row updated' };
  }
  return { ok: true, userId };
}

/**
 * @param {{ keeper: object; familyId: string }} args
 */
export async function readFamilyListRoleForKeeper(args) {
  loadEnvLocal();
  const gatewayUrl = process.env.GATEWAY_URL?.replace(/\/$/, '');
  if (!gatewayUrl) throw new Error('GATEWAY_URL is not set');
  const access = await getKeeperAccessToken({
    workspaceEmail: args.keeper.workspaceEmail,
    password: args.keeper.password,
    phoneDigits: args.keeper.phoneDigits,
  });
  const { res, data } = await fetch(`${gatewayUrl}/v1/user/families?limit=24`, {
    headers: { Authorization: `Bearer ${access}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  }).then(async (r) => ({ res: r, data: await r.json().catch(() => ({})) }));
  if (!res.ok) {
    return { ok: false, status: res.status, message: 'list families failed' };
  }
  const family = (data.items ?? []).find((f) => f.id === args.familyId);
  if (!family) {
    return { ok: false, message: 'family not in list' };
  }
  return {
    ok: true,
    role: family.role,
    isOwner: Boolean(family.isOwner),
    access,
    gatewayUrl,
  };
}

/**
 * Gateway probe for owner-not-keeper (E18): keeper or owner may mutate invites on family-service.
 *
 * @param {{ keeper: object; familyId: string; roleTemplateId: string; inviteId: string; inviteEmail: string; invitePhoneDigits: string }} args
 */
export async function probeOwnerNotKeeperInviteMutations(args) {
  const ctx = await readFamilyListRoleForKeeper({ keeper: args.keeper, familyId: args.familyId });
  if (!ctx.ok) return { ok: false, ...ctx };

  const phone = phoneE164FromDigits(args.invitePhoneDigits);
  const create = await createMemberInviteGateway({
    gatewayUrl: ctx.gatewayUrl,
    familyId: args.familyId,
    access: ctx.access,
    body: {
      roleTemplateId: args.roleTemplateId,
      displayName: 'E18 Probe',
      phone,
      personalEmail: args.inviteEmail,
    },
  });
  const list = await listFamilyMemberInvitesGateway({
    gatewayUrl: ctx.gatewayUrl,
    familyId: args.familyId,
    access: ctx.access,
  });
  let roleTemplatesStatus = 500;
  try {
    await listRoleTemplates(ctx.gatewayUrl, args.familyId, ctx.access);
    roleTemplatesStatus = 200;
  } catch {
    roleTemplatesStatus = 403;
  }
  const resend = await resendInviteGateway({
    gatewayUrl: ctx.gatewayUrl,
    familyId: args.familyId,
    access: ctx.access,
    inviteId: args.inviteId,
  });

  return {
    ok: true,
    familyRole: ctx.role,
    isOwner: ctx.isOwner,
    createStatus: create.status,
    createCode: create.data?.code,
    listStatus: list.status,
    roleTemplatesStatus,
    resendStatus: resend.status,
    resendCode: resend.data?.code,
  };
}

/**
 * @param {{ keeper: object; familyId: string }} args
 */
export async function seedOwnerNotKeeperState(args) {
  const demote = await demoteKeeperToOwnerMember({ familyId: args.familyId });
  if (!demote.ok) return demote;
  const listCtx = await readFamilyListRoleForKeeper({
    keeper: args.keeper,
    familyId: args.familyId,
  });
  if (!listCtx.ok) {
    return { ok: false, message: listCtx.message ?? 'family list after demote failed' };
  }
  if (listCtx.role === 'keeper') {
    return { ok: false, message: 'gateway still reports keeper role after SQL demote' };
  }
  if (!listCtx.isOwner) {
    return {
      ok: false,
      message: `expected isOwner=true after demote, got role=${listCtx.role} isOwner=${listCtx.isOwner}`,
    };
  }
  return {
    ok: true,
    userId: demote.userId,
    role: listCtx.role,
    isOwner: listCtx.isOwner,
  };
}

export async function fetchMemberUserIdForFamily(familyId) {
  const familyLiteral = sqlFamilyIdLiteral(familyId);
  const sql = `SELECT user_id FROM memberships WHERE family_id = ${familyLiteral} AND role <> 'keeper' ORDER BY created_at DESC LIMIT 1`;
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
