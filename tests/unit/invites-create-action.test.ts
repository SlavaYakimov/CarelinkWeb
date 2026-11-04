import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GatewayError } from '@/server/gateway/errors';

const familyId = '22222222-2222-4222-8222-222222222222';
const roleTemplateId = '550e8400-e29b-41d4-a716-446655440000';

function redirectError(url: string): Error {
  const err = new Error('NEXT_REDIRECT');
  (err as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
  return err;
}

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw redirectError(url);
  }),
  unstable_rethrow: vi.fn((err: unknown) => {
    if (
      err &&
      typeof err === 'object' &&
      'digest' in err &&
      typeof (err as { digest: unknown }).digest === 'string' &&
      (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
    ) {
      throw err;
    }
  }),
}));

const createMemberInvite = vi.fn();

vi.mock('@/server/gateway/invites', () => ({
  createMemberInvite: (...args: unknown[]) => createMemberInvite(...args),
  uploadMemberInviteAvatar: vi.fn(),
}));

vi.mock('@/server/session/get-session', () => ({
  getSession: vi.fn().mockResolvedValue({
    sid: 'sid-1',
    session: {
      userId: 'user-1',
      defaultFamilyId: familyId,
      activeFamilyId: familyId,
      userRefresh: 'ur-old',
      deviceSession: 'ds',
      families: {
        [familyId]: {
          access: 'access-old',
          refresh: 'refresh-old',
          expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        },
      },
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    },
  }),
}));

vi.mock('@/server/actions/request-context', () => ({
  gatewayActionContext: vi.fn().mockResolvedValue({ clientIp: '127.0.0.1', deviceId: 'dev-1' }),
}));

describe('createMemberInviteAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /forbidden on gateway FORBIDDEN (403)', async () => {
    createMemberInvite.mockRejectedValue(new GatewayError({ code: 'FORBIDDEN', status: 403 }));

    const { createMemberInviteAction } = await import('@/server/actions/invites');

    const formData = new FormData();
    formData.set('familyId', familyId);
    formData.set('displayName', 'Guest');
    formData.set('personalEmail', 'guest@example.com');
    formData.set('phone', '+79001234567');
    formData.set('roleTemplateId', roleTemplateId);

    await expect(createMemberInviteAction({}, formData)).rejects.toMatchObject({
      digest: expect.stringContaining('/forbidden'),
    });
  });
});
