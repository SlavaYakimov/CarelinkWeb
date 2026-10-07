import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GatewayError } from '@/server/gateway/errors';

const checkSlugMock = vi.fn();
const requireFlowMock = vi.fn();
const getSessionMock = vi.fn();
const gatewayCtxMock = vi.fn();

vi.mock('@/server/gateway/onboarding', () => ({
  onboardingCheckWorkspaceSlug: (...args: unknown[]) => checkSlugMock(...args),
}));

vi.mock('@/server/flows/onboarding-flow', () => ({
  requireOnboardingFlow: (...args: unknown[]) => requireFlowMock(...args),
}));

vi.mock('@/server/session/get-session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/server/actions/request-context', () => ({
  gatewayActionContext: (...args: unknown[]) => gatewayCtxMock(...args),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

describe('checkOnboardingWorkspaceSlugAction', () => {
  beforeEach(() => {
    checkSlugMock.mockReset();
    requireFlowMock.mockReset();
    getSessionMock.mockReset();
    gatewayCtxMock.mockReset();
    requireFlowMock.mockResolvedValue({
      fid: 'fid-1',
      flow: { step: 'workspace', deviceSession: 'ds-1', kind: 'onboarding', createdAt: '' },
    });
    getSessionMock.mockResolvedValue({ sid: 'sid-1', session: { activeFamilyId: 'f1' } });
    gatewayCtxMock.mockResolvedValue({ clientIp: '127.0.0.1', deviceId: 'dev-1' });
  });

  it('returns invalid for bad format without calling gateway', async () => {
    const { checkOnboardingWorkspaceSlugAction } = await import('@/server/actions/onboarding');
    const result = await checkOnboardingWorkspaceSlugAction('ab');
    expect(result.status).toBe('invalid');
    expect(checkSlugMock).not.toHaveBeenCalled();
  });

  it('returns taken when gateway reports unavailable slug', async () => {
    checkSlugMock.mockResolvedValue({ available: false, workspaceSlug: 'ivanovy' });
    const { checkOnboardingWorkspaceSlugAction } = await import('@/server/actions/onboarding');
    const result = await checkOnboardingWorkspaceSlugAction('ivanovy');
    expect(result).toEqual({
      status: 'taken',
      workspaceSlug: 'ivanovy',
      message: 'Этот адрес семьи уже занят',
    });
    expect(checkSlugMock).toHaveBeenCalledWith(
      { workspaceSlug: 'ivanovy' },
      expect.objectContaining({ deviceSession: 'ds-1', deviceId: 'dev-1' }),
    );
  });

  it('returns available with normalized slug from gateway', async () => {
    checkSlugMock.mockResolvedValue({ available: true, workspaceSlug: 'ivanovy' });
    const { checkOnboardingWorkspaceSlugAction } = await import('@/server/actions/onboarding');
    const result = await checkOnboardingWorkspaceSlugAction(' Ivanovy ');
    expect(result).toEqual({ status: 'available', workspaceSlug: 'ivanovy' });
  });

  it('maps gateway 400 to invalid slug', async () => {
    checkSlugMock.mockRejectedValue(new GatewayError({ code: 'INVALID_ARGUMENT', status: 400 }));
    const { checkOnboardingWorkspaceSlugAction } = await import('@/server/actions/onboarding');
    const result = await checkOnboardingWorkspaceSlugAction('bad slug');
    expect(result.status).toBe('invalid');
  });
});
