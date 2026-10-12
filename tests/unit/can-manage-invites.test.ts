import { describe, it, expect, vi, beforeEach } from 'vitest';

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
}));

const fetchUserFamilies = vi.fn();

vi.mock('@/server/data/user-families', () => ({
  fetchUserFamilies: () => fetchUserFamilies(),
}));

vi.mock('@/server/session/get-session', () => ({
  getSession: vi.fn(),
}));

describe('requireCanManageInvites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /forbidden when user is a plain member', async () => {
    fetchUserFamilies.mockResolvedValue([
      { id: familyId, role: 'member', isOwner: false, name: 'Fam' },
    ]);

    const { requireCanManageInvites } = await import('@/server/data/family-invites');

    await expect(requireCanManageInvites(familyId)).rejects.toMatchObject({
      digest: expect.stringContaining('/forbidden'),
    });
  });

  it('allows keeper role', async () => {
    fetchUserFamilies.mockResolvedValue([
      { id: familyId, role: 'keeper', isOwner: false, name: 'Fam' },
    ]);

    const { requireCanManageInvites } = await import('@/server/data/family-invites');

    await expect(requireCanManageInvites(familyId)).resolves.toBeUndefined();
  });

  it('allows family owner even when role is not keeper', async () => {
    fetchUserFamilies.mockResolvedValue([
      { id: familyId, role: 'member', isOwner: true, name: 'Fam' },
    ]);

    const { requireCanManageInvites } = await import('@/server/data/family-invites');

    await expect(requireCanManageInvites(familyId)).resolves.toBeUndefined();
  });
});
