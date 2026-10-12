import { describe, expect, it } from 'vitest';
import { normalizeInviteCode } from '@/server/flows/invite-flow';
import { inviteCanResendOrRevoke, memberInviteStatusLabel } from '@/lib/invites/status-labels';
import { parseInviteUnavailableReason } from '@/lib/invites/unavailable-reason';
import { memberInviteClientSchema } from '@/lib/forms/schemas';

describe('invite flow code', () => {
  it('accepts alphanumeric invite codes', () => {
    expect(normalizeInviteCode('abc123XY-_')).toBe('abc123XY-_');
  });

  it('rejects short or invalid codes', () => {
    expect(normalizeInviteCode('abc')).toBeNull();
    expect(normalizeInviteCode('bad code!')).toBeNull();
  });
});

describe('invite status labels', () => {
  it('maps backend statuses to RU labels', () => {
    expect(memberInviteStatusLabel('pending_accept')).toBe('Ожидает принятия');
    expect(inviteCanResendOrRevoke('sent')).toBe(true);
    expect(inviteCanResendOrRevoke('accepted')).toBe(false);
  });
});

describe('invite unavailable reasons', () => {
  it('defaults unknown reason to not_found', () => {
    expect(parseInviteUnavailableReason(undefined)).toBe('not_found');
    expect(parseInviteUnavailableReason('expired')).toBe('expired');
  });
});

describe('member invite form schema', () => {
  it('requires valid phone and role', () => {
    const ok = memberInviteClientSchema.safeParse({
      displayName: 'Anna',
      personalEmail: 'a@example.com',
      phone: '+79001234567',
      roleTemplateId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(ok.success).toBe(true);
  });
});
