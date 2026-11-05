import { describe, it, expect } from 'vitest';
import { assignMemberLabelsSchema } from '@/lib/member-labels/schemas';

describe('member-labels schemas', () => {
  it('allows up to 10 targets and rejects 11', () => {
    const familyId = '11111111-1111-4111-8111-111111111111';
    const ids = Array.from({ length: 10 }, (_, i) => `1111111${i}-1111-4111-8111-11111111111${i}`);
    expect(
      assignMemberLabelsSchema.safeParse({
        familyId,
        labelText: 'рядом',
        targetUserIds: ids,
      }).success,
    ).toBe(true);

    const tooMany = [...ids, '99999999-9999-4999-8999-999999999999'];
    expect(
      assignMemberLabelsSchema.safeParse({
        familyId,
        labelText: 'рядом',
        targetUserIds: tooMany,
      }).success,
    ).toBe(false);
  });
});
