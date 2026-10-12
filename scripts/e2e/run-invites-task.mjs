#!/usr/bin/env node
/**
 * Cypress task runner for invites compose (stdout JSON).
 * Usage: node run-invites-task.mjs <taskName> '<jsonArgs>'
 */
import { fetchMemberInviteEmail } from './fetch-member-invite-email.mjs';
import {
  acceptInviteAsWrongUser,
  expireMemberInvite,
  gatewayLookupSmoke,
  hammerLookupEmail,
  revokeInviteFixture,
  seedPendingExistingInvite,
  setFamilyMemberInvitesEnabled,
  setFamilyMemberInvitesEnabledAndVerify,
} from './invites-compose-fixtures.mjs';
import {
  acceptMemberInviteGateway,
  createMemberInviteGateway,
  lookupInviteEmail,
  resolveKeeperGatewayContext,
  resendInviteGateway,
} from './invites-gateway.mjs';
import { createInviteAsMember } from './invites-compose-fixtures.mjs';

const task = process.argv[2];
const args = process.argv[3] ? JSON.parse(process.argv[3]) : {};

async function main() {
  switch (task) {
    case 'invitesResolveKeeperContext':
      return resolveKeeperGatewayContext(args);
    case 'invitesSeedPendingExisting':
      return seedPendingExistingInvite(args);
    case 'invitesFetchMemberEmail':
      return fetchMemberInviteEmail(args);
    case 'invitesHammerLookup':
      return hammerLookupEmail(args);
    case 'invitesExpire':
      return expireMemberInvite(args);
    case 'invitesSetFlag':
      if (args.verify && args.keeper) {
        return setFamilyMemberInvitesEnabledAndVerify(args);
      }
      return setFamilyMemberInvitesEnabled(args);
    case 'invitesAcceptWrongUser':
      return acceptInviteAsWrongUser(args);
    case 'invitesRevoke':
      return revokeInviteFixture(args);
    case 'invitesGatewayLookup':
      return gatewayLookupSmoke(args);
    case 'invitesGatewayCreateAsMember':
      return createInviteAsMember(args);
    case 'invitesGatewayAccept':
      return acceptMemberInviteGateway(args);
    case 'invitesGatewayAcceptAsInvitee': {
      const inviteeCtx = await resolveKeeperGatewayContext(args.invitee);
      return acceptMemberInviteGateway({
        gatewayUrl: inviteeCtx.gatewayUrl,
        access: inviteeCtx.access,
        inviteId: args.inviteId,
      });
    }
    case 'invitesGatewayLookupRaw':
      return lookupInviteEmail(args.gatewayUrl, args.familyId, args.access, args.email);
    case 'invitesGatewayCreate':
      return createMemberInviteGateway(args);
    case 'invitesGatewayResend':
      return resendInviteGateway(args);
    default:
      throw new Error(`Unknown invites task: ${task}`);
  }
}

main()
  .then((result) => {
    process.stdout.write(JSON.stringify(result ?? null));
  })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
