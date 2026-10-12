import { describe, it, expect, vi, beforeEach } from 'vitest';

const inviteId = '11111111-1111-4111-8111-111111111111';
const familyId = '22222222-2222-4222-8222-222222222222';

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

vi.mock('@/server/gateway/invites', () => ({
  acceptMemberInvite: vi.fn().mockResolvedValue({ accepted: true }),
  rebuildAuthSession: vi.fn().mockResolvedValue({
    session: {
      defaultFamilyId: familyId,
      userRefresh: 'ur-new',
      families: [
        {
          familyId,
          access: 'access-new',
          refresh: 'refresh-new',
          expiresAt: Date.now() + 3600_000,
        },
      ],
    },
  }),
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

vi.mock('@/server/session/store', () => ({
  saveSession: vi.fn().mockResolvedValue(undefined),
}));

describe('acceptMemberInviteAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /families when accept and rebuild succeed', async () => {
    const { acceptMemberInviteAction } = await import('@/server/actions/invites');
    const formData = new FormData();
    formData.set('inviteId', inviteId);

    await expect(acceptMemberInviteAction({}, formData)).rejects.toMatchObject({
      digest: expect.stringContaining('/families'),
    });
  });
});
