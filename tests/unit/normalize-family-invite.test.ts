import { describe, expect, it } from 'vitest';
import { normalizeFamilyMemberInviteList } from '@/lib/invites/normalize-family-invite';
import { memberInviteStatusLabel, normalizeMemberInviteStatus } from '@/lib/invites/status-labels';

describe('normalizeMemberInviteStatus', () => {
  it('maps backend pending to sent for keeper list copy', () => {
    expect(normalizeMemberInviteStatus('pending')).toBe('sent');
    expect(memberInviteStatusLabel('pending')).toBe('Отправлено');
  });
});

describe('normalizeFamilyMemberInviteList', () => {
  it('maps snake_case and personal email', () => {
    const list = normalizeFamilyMemberInviteList({
      items: [
        {
          invite_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          display_name: 'E2E List',
          personal_email: 'e2e.list@example.com',
          role_name: 'Adult',
          status: 'pending',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    });
    expect(list).toHaveLength(1);
    expect(list[0]?.status).toBe('sent');
    expect(list[0]?.emailMasked).toBe('e2***@example.com');
  });
});
