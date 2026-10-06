import 'server-only';
import { gatewayFetch, type GatewayRequestContext } from '@/server/gateway/client';
import type { components } from '@/server/gateway/types.gen';

type FamilyListResponse = components['schemas']['FamilyListResponse'];
type CreateFamilyRequest = components['schemas']['CreateFamilyRequest'];
type CreateFamilyResponse = components['schemas']['CreateFamilyResponse'];

export async function listUserFamilies(
  ctx: GatewayRequestContext & {
    sid: string;
    session: NonNullable<GatewayRequestContext['session']>;
  },
  query: { page?: number; limit?: number } = {},
): Promise<FamilyListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  const path = qs ? `/v1/user/families?${qs}` : '/v1/user/families';
  return gatewayFetch<FamilyListResponse>({ method: 'GET', path }, ctx);
}

export async function createFamily(
  body: CreateFamilyRequest,
  ctx: GatewayRequestContext & {
    sid: string;
    session: NonNullable<GatewayRequestContext['session']>;
  },
): Promise<CreateFamilyResponse> {
  return gatewayFetch<CreateFamilyResponse>({ method: 'POST', path: '/v1/families', body }, ctx);
}
