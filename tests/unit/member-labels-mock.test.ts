import { describe, it, expect, beforeEach } from 'vitest';
import {
  memberLabelsMockGateway,
  resetMemberLabelsMockStore,
} from '@/server/gateway/member-labels.mock';
import { MemberLabelBatchError } from '@/lib/member-labels/batch-error';

const familyId = '11111111-1111-4111-8111-111111111111';
const ctx = {
  familyId,
  session: { userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
};

describe('member-labels mock gateway', () => {
  beforeEach(() => {
    resetMemberLabelsMockStore();
    process.env.MEMBER_LABELS_MOCK = '1';
  });

  it('creates batch and lists labels', async () => {
    const target = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    await memberLabelsMockGateway(
      {
        method: 'POST',
        path: `/v1/families/${familyId}/member-labels`,
        body: { labelText: 'свет', targetUserIds: [target] },
      },
      ctx,
    );
    const list = await memberLabelsMockGateway<{ items: { labelText: string }[] }>(
      { method: 'GET', path: `/v1/families/${familyId}/member-labels` },
      ctx,
    );
    expect(list.items.some((i) => i.labelText === 'свет')).toBe(true);
  });

  it('rolls back when target exceeds active label cap', async () => {
    const target = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    for (let i = 0; i < 5; i += 1) {
      await memberLabelsMockGateway(
        {
          method: 'POST',
          path: `/v1/families/${familyId}/member-labels`,
          body: { labelText: `m${i}`, targetUserIds: [target] },
        },
        ctx,
      );
    }
    await expect(
      memberLabelsMockGateway(
        {
          method: 'POST',
          path: `/v1/families/${familyId}/member-labels`,
          body: { labelText: 'extra', targetUserIds: [target] },
        },
        ctx,
      ),
    ).rejects.toBeInstanceOf(MemberLabelBatchError);
  });
});
