import { describe, expect, it } from 'vitest';
import {
  normalizePendingMemberInvite,
  normalizePendingMemberInviteList,
} from '@/lib/invites/normalize-pending-invite';

describe('normalizePendingMemberInvite', () => {
  it('maps OpenAPI camelCase fields', () => {
    const row = {
      id: '11111111-1111-4111-8111-111111111111',
      familyId: '22222222-2222-4222-8222-222222222222',
      familyName: 'Семья Ивановых',
      roleName: 'Взрослый',
      invitedByDisplayName: 'Иван',
      expiresAt: '2026-12-01T12:00:00Z',
    };
    expect(normalizePendingMemberInvite(row)).toEqual(row);
  });

  it('maps family-service inviteId and invitedByName', () => {
    const normalized = normalizePendingMemberInvite({
      inviteId: '33333333-3333-4333-8333-333333333333',
      familyId: '44444444-4444-4444-8444-444444444444',
      familyName: 'E2E Family',
      roleName: 'Member',
      invitedByName: 'Keeper',
      expiresAt: '2026-12-01T12:00:00Z',
      status: 'pending_accept',
    });
    expect(normalized).toMatchObject({
      id: '33333333-3333-4333-8333-333333333333',
      invitedByDisplayName: 'Keeper',
      familyName: 'E2E Family',
    });
  });

});

describe('normalizePendingMemberInviteList', () => {
  it('reads items wrapper and snake_case rows', () => {
    const list = normalizePendingMemberInviteList({
      items: [
        {
          invite_id: '77777777-7777-4777-8777-777777777777',
          family_id: '88888888-8888-4888-8888-888888888888',
          family_name: 'Snake Family',
          role_name: 'Adult',
          invited_by_name: 'Bob',
          expires_at: '2026-12-01T12:00:00Z',
        },
      ],
    });
    expect(list).toHaveLength(1);
    expect(list[0]?.familyName).toBe('Snake Family');
    expect(list[0]?.id).toBe('77777777-7777-4777-8777-777777777777');
  });
});
