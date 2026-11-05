import 'server-only';
import { gatewayFetch, type GatewayRequestContext } from '@/server/gateway/client';
import type { components } from '@/server/gateway/types.gen';

type SessionCtx = GatewayRequestContext & {
  sid: string;
  session: NonNullable<GatewayRequestContext['session']>;
  familyId: string;
};

type ListResponse = components['schemas']['FamilyMemberListResponse'];

export async function listFamilyMembers(ctx: SessionCtx): Promise<ListResponse> {
  return gatewayFetch<ListResponse>(
    { method: 'GET', path: `/v1/families/${ctx.familyId}/members` },
    ctx,
  );
}
