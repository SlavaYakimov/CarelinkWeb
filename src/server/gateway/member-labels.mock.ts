import 'server-only';
import { randomUUID } from 'node:crypto';
import type { GatewayRequestInit } from '@/server/gateway/client';
import type { components } from '@/server/gateway/types.gen';
import { MEMBER_LABEL_MAX_ACTIVE_PER_USER } from '@/lib/member-labels/constants';

type SessionCtx = {
  familyId: string;
  session: { userId: string };
};

type MemberLabel = components['schemas']['MemberLabel'];
type BatchResponse = components['schemas']['MemberLabelBatchResponse'];
type CreateBody = components['schemas']['CreateMemberLabelsRequest'];
type BadRequestBody = components['schemas']['MemberLabelBadRequestBody'];

const store = new Map<string, MemberLabel[]>();

function key(familyId: string): string {
  return familyId;
}

function countForTarget(items: MemberLabel[], targetUserId: string): number {
  return items.filter((l) => l.targetUserId === targetUserId).length;
}

export async function memberLabelsMockGateway<T>(
  init: GatewayRequestInit,
  ctx: SessionCtx,
): Promise<T> {
  const bucket = store.get(key(ctx.familyId)) ?? [];
  const path = init.path;

  if (
    init.method === 'GET' &&
    path.includes('/member-labels') &&
    !path.includes('/member-labels/')
  ) {
    const url = new URL(path, 'https://mock.local');
    const target = url.searchParams.get('targetUserId');
    const items = target ? bucket.filter((l) => l.targetUserId === target) : [...bucket];
    return { items } as T;
  }

  if (init.method === 'POST' && path.endsWith('/member-labels')) {
    const body = init.body as CreateBody;
    const rejectedTargets: BadRequestBody['rejectedTargets'] = [];
    for (const targetUserId of body.targetUserIds) {
      if (countForTarget(bucket, targetUserId) >= MEMBER_LABEL_MAX_ACTIVE_PER_USER) {
        rejectedTargets.push({ userId: targetUserId, reason: 'max_labels' });
      }
    }
    if (rejectedTargets.length > 0) {
      const payload: BadRequestBody = {
        code: 'BAD_REQUEST',
        rejectedTargets,
        message: 'batch rejected',
      };
      const { MemberLabelBatchError } = await import('@/lib/member-labels/batch-error');
      throw new MemberLabelBatchError(payload);
    }
    const batchId = randomUUID();
    const now = new Date().toISOString();
    const created: MemberLabel[] = body.targetUserIds.map((targetUserId) => ({
      id: randomUUID(),
      batchId,
      familyId: ctx.familyId,
      targetUserId,
      labelText: body.labelText,
      setByUserId: ctx.session.userId,
      createdAt: now,
      updatedAt: now,
    }));
    bucket.push(...created);
    store.set(key(ctx.familyId), bucket);
    return { batchId, items: created } satisfies BatchResponse as T;
  }

  if (init.method === 'DELETE' && path.includes('/member-labels/')) {
    const labelId = path.split('/').pop()!;
    const next = bucket.filter((l) => l.id !== labelId);
    store.set(key(ctx.familyId), next);
    return undefined as T;
  }

  throw new Error(`member-labels mock: unhandled ${init.method} ${path}`);
}

/** Test helper */
export function resetMemberLabelsMockStore(): void {
  store.clear();
}
