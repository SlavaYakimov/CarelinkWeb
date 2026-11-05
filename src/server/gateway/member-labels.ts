import 'server-only';
import { gatewayFetch, type GatewayRequestContext } from '@/server/gateway/client';
import { GatewayError } from '@/server/gateway/errors';
import { MemberLabelBatchError } from '@/lib/member-labels/batch-error';
import type { components } from '@/server/gateway/types.gen';

export { MemberLabelBatchError };

type SessionCtx = GatewayRequestContext & {
  sid: string;
  session: NonNullable<GatewayRequestContext['session']>;
  familyId: string;
};

type CreateBody = components['schemas']['CreateMemberLabelsRequest'];
type BatchResponse = components['schemas']['MemberLabelBatchResponse'];
type ListResponse = components['schemas']['MemberLabelListResponse'];
type BadRequestBody = components['schemas']['MemberLabelBadRequestBody'];

function familyPath(familyId: string, suffix: string): string {
  return `/v1/families/${familyId}${suffix}`;
}

async function gatewayFetchMemberLabels<T>(
  init: Parameters<typeof gatewayFetch>[0],
  ctx: SessionCtx,
): Promise<T> {
  if (process.env.MEMBER_LABELS_MOCK === '1') {
    const { memberLabelsMockGateway } = await import('@/server/gateway/member-labels.mock');
    return memberLabelsMockGateway<T>(init, ctx);
  }
  return gatewayFetch<T>(init, ctx);
}

export async function listMemberLabels(
  ctx: SessionCtx,
  query: { targetUserId?: string } = {},
): Promise<ListResponse> {
  const params = new URLSearchParams();
  if (query.targetUserId) params.set('targetUserId', query.targetUserId);
  const qs = params.toString();
  const path = qs
    ? `${familyPath(ctx.familyId, '/member-labels')}?${qs}`
    : familyPath(ctx.familyId, '/member-labels');
  return gatewayFetchMemberLabels<ListResponse>({ method: 'GET', path }, ctx);
}

export async function createMemberLabels(
  body: CreateBody,
  ctx: SessionCtx,
): Promise<BatchResponse> {
  try {
    return await gatewayFetchMemberLabels<BatchResponse>(
      { method: 'POST', path: familyPath(ctx.familyId, '/member-labels'), body },
      ctx,
    );
  } catch (err) {
    if (err instanceof MemberLabelBatchError) throw err;
    if (err instanceof GatewayError && err.code === 'BAD_REQUEST' && err.body) {
      throw new MemberLabelBatchError(err.body as BadRequestBody);
    }
    throw err;
  }
}

export async function deleteMemberLabel(ctx: SessionCtx, labelId: string): Promise<void> {
  await gatewayFetchMemberLabels<void>(
    { method: 'DELETE', path: familyPath(ctx.familyId, `/member-labels/${labelId}`) },
    ctx,
  );
}
