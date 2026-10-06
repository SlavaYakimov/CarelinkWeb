import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GatewayError } from '@/server/gateway/errors';

const completeMock = vi.fn();

vi.mock('@/server/gateway/auth', () => ({
  workspaceSignInComplete: (...args: unknown[]) => completeMock(...args),
}));

vi.mock('@/server/flows/signin-flow', () => ({
  clearSignInFlow: vi.fn(),
  persistSignInFlow: vi.fn(),
}));

vi.mock('@/server/session/cookies', () => ({
  setSessionCookie: vi.fn(),
}));

vi.mock('@/server/session/get-session', () => ({
  bindNewSession: vi.fn(async () => ({ sid: 'sid-1' })),
}));

vi.mock('@/server/session/from-auth-session', () => ({
  sessionRecordFromAuthResponse: vi.fn(() => ({})),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

describe('finishSignInAfterDeviceVerified', () => {
  beforeEach(() => {
    completeMock.mockReset();
  });

  it('calls complete without password (BE-06)', async () => {
    completeMock.mockResolvedValue({
      requiresPasswordChange: false,
      session: { userId: 'u1', defaultFamilyId: 'f1', families: [] },
    });

    const { finishSignInAfterDeviceVerified } = await import('@/server/flows/finish-sign-in');

    await expect(
      finishSignInAfterDeviceVerified(
        'fid',
        {
          kind: 'signin',
          step: 'verify-sms',
          challengeId: 'ch-1',
          deviceSession: 'ds-1',
          createdAt: new Date().toISOString(),
        },
        { clientIp: '127.0.0.1', deviceId: 'dev-1', next: '/families' },
      ),
    ).rejects.toThrow('REDIRECT:/families');

    expect(completeMock).toHaveBeenCalledWith(
      { challengeId: 'ch-1', deviceId: 'dev-1' },
      expect.objectContaining({ deviceSession: 'ds-1', deviceId: 'dev-1' }),
    );
  });

  it('redirects to too-many with Retry-After from gateway error', async () => {
    completeMock.mockRejectedValue(
      new GatewayError({ code: 'RATE_LIMIT', status: 429, retryAfter: 45 }),
    );

    const { finishSignInAfterDeviceVerified } = await import('@/server/flows/finish-sign-in');

    await expect(
      finishSignInAfterDeviceVerified(
        'fid',
        {
          kind: 'signin',
          step: 'verify-sms',
          challengeId: 'ch-1',
          deviceSession: 'ds-1',
          createdAt: new Date().toISOString(),
        },
        { clientIp: '127.0.0.1', deviceId: 'dev-1' },
      ),
    ).rejects.toThrow('REDIRECT:/login/too-many?retryAfter=45');
  });
});
