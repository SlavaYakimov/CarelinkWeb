import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyPhoneMock = vi.fn();
const requireFlowMock = vi.fn();
const persistFlowMock = vi.fn();
const clearFlowMock = vi.fn();
const gatewayCtxMock = vi.fn();
const abandonMock = vi.fn();
const logWarnMock = vi.fn();

vi.mock('@/server/gateway/onboarding', () => ({
  onboardingVerifyPhone: (...args: unknown[]) => verifyPhoneMock(...args),
  onboardingAbandon: (...args: unknown[]) => abandonMock(...args),
}));

vi.mock('@/server/log/logger', () => ({
  getLogger: () => ({ warn: logWarnMock, info: vi.fn(), error: vi.fn() }),
}));

vi.mock('@/server/flows/onboarding-flow', () => ({
  requireOnboardingFlow: (...args: unknown[]) => requireFlowMock(...args),
  persistOnboardingFlow: (...args: unknown[]) => persistFlowMock(...args),
  clearOnboardingFlow: (...args: unknown[]) => clearFlowMock(...args),
}));

vi.mock('@/server/actions/request-context', () => ({
  gatewayActionContext: (...args: unknown[]) => gatewayCtxMock(...args),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const phoneFlow = {
  kind: 'onboarding',
  step: 'phone',
  onboardingChallengeId: 'ch-1',
  phoneE164: '+79001234567',
  keeperDisplayName: 'Иван',
  createdAt: '',
};

function codeForm(code = '123456'): FormData {
  const fd = new FormData();
  fd.set('code', code);
  return fd;
}

describe('confirmOnboardingPhoneOtpAction — existingUser', () => {
  beforeEach(() => {
    verifyPhoneMock.mockReset();
    requireFlowMock.mockReset();
    persistFlowMock.mockReset();
    clearFlowMock.mockReset();
    gatewayCtxMock.mockReset();
    requireFlowMock.mockResolvedValue({ fid: 'fid-1', flow: phoneFlow });
    gatewayCtxMock.mockResolvedValue({ clientIp: '127.0.0.1', deviceId: 'dev-1' });
  });

  it('keeps the flow and redirects to the choice screen for an existing user', async () => {
    verifyPhoneMock.mockResolvedValue({
      userId: 'u-1',
      onboardingChallengeId: 'ch-1',
      existingUser: true,
      deviceRegistrationToken: 'drt-1',
    });
    const { confirmOnboardingPhoneOtpAction } = await import('@/server/actions/onboarding');

    await expect(confirmOnboardingPhoneOtpAction({}, codeForm())).rejects.toThrow(
      'REDIRECT:/onboarding/existing',
    );
    expect(clearFlowMock).not.toHaveBeenCalled();
    expect(persistFlowMock).toHaveBeenCalledWith(
      'fid-1',
      expect.objectContaining({
        step: 'device',
        userId: 'u-1',
        existingUser: true,
        deviceRegistrationToken: 'drt-1',
      }),
    );
  });

  it('stores the families returned for an existing user', async () => {
    verifyPhoneMock.mockResolvedValue({
      userId: 'u-1',
      onboardingChallengeId: 'ch-1',
      existingUser: true,
      workspaces: [{ workspaceSlug: 'home-one', displayName: 'Дом' }],
    });
    const { confirmOnboardingPhoneOtpAction } = await import('@/server/actions/onboarding');

    await expect(confirmOnboardingPhoneOtpAction({}, codeForm())).rejects.toThrow(
      'REDIRECT:/onboarding/existing',
    );
    expect(persistFlowMock).toHaveBeenCalledWith(
      'fid-1',
      expect.objectContaining({
        existingWorkspaces: [{ workspaceSlug: 'home-one', displayName: 'Дом' }],
      }),
    );
  });

  it('goes straight to the device step for a new user', async () => {
    verifyPhoneMock.mockResolvedValue({
      userId: 'u-2',
      onboardingChallengeId: 'ch-1',
      existingUser: false,
    });
    const { confirmOnboardingPhoneOtpAction } = await import('@/server/actions/onboarding');

    await expect(confirmOnboardingPhoneOtpAction({}, codeForm())).rejects.toThrow(
      'REDIRECT:/onboarding/device',
    );
    expect(persistFlowMock).toHaveBeenCalledWith(
      'fid-1',
      expect.objectContaining({ step: 'device', existingUser: false }),
    );
  });
});

const deviceFlow = {
  ...phoneFlow,
  step: 'device',
  existingUser: true,
  existingWorkspaces: [{ workspaceSlug: 'home-one', displayName: 'Дом' }],
};

function slugForm(slug: string): FormData {
  const fd = new FormData();
  fd.set('workspaceSlug', slug);
  return fd;
}

describe('existing-phone choice actions', () => {
  beforeEach(() => {
    requireFlowMock.mockReset();
    clearFlowMock.mockReset();
    abandonMock.mockReset();
    logWarnMock.mockReset();
    gatewayCtxMock.mockReset();
    requireFlowMock.mockResolvedValue({ fid: 'fid-1', flow: deviceFlow });
    gatewayCtxMock.mockResolvedValue({ clientIp: '127.0.0.1', deviceId: 'dev-1' });
    abandonMock.mockResolvedValue(undefined);
  });

  it('continueOnboardingAsNewFamilyAction requires the device step and goes on', async () => {
    const { continueOnboardingAsNewFamilyAction } = await import('@/server/actions/onboarding');

    await expect(continueOnboardingAsNewFamilyAction()).rejects.toThrow(
      'REDIRECT:/onboarding/device',
    );
    expect(requireFlowMock).toHaveBeenCalledWith('device');
    expect(abandonMock).not.toHaveBeenCalled();
  });

  it('leaving for a listed family abandons the draft and prefills login', async () => {
    const { leaveOnboardingToLoginAction } = await import('@/server/actions/onboarding');

    await expect(leaveOnboardingToLoginAction(slugForm('Home-One'))).rejects.toThrow(
      'REDIRECT:/login?reason=phone-registered&workspace=home-one',
    );
    expect(abandonMock).toHaveBeenCalledWith(
      { onboardingChallengeId: 'ch-1' },
      { clientIp: '127.0.0.1', deviceId: 'dev-1' },
    );
    expect(clearFlowMock).toHaveBeenCalledTimes(1);
  });

  it('ignores a family that is not in the list', async () => {
    const { leaveOnboardingToLoginAction } = await import('@/server/actions/onboarding');

    await expect(leaveOnboardingToLoginAction(slugForm('someone-else'))).rejects.toThrow(
      'REDIRECT:/login?reason=phone-registered',
    );
    expect(abandonMock).toHaveBeenCalledTimes(1);
  });

  it('leaving without a family opens login with the reason only', async () => {
    const { leaveOnboardingToLoginAction } = await import('@/server/actions/onboarding');

    await expect(leaveOnboardingToLoginAction()).rejects.toThrow(
      'REDIRECT:/login?reason=phone-registered',
    );
    expect(clearFlowMock).toHaveBeenCalledTimes(1);
  });

  it('a failed abandon does not block the way to login', async () => {
    const { GatewayError } = await import('@/server/gateway/errors');
    abandonMock.mockRejectedValue(new GatewayError({ code: 'UNKNOWN', status: 502 }));
    const { leaveOnboardingToLoginAction } = await import('@/server/actions/onboarding');

    await expect(leaveOnboardingToLoginAction(slugForm('home-one'))).rejects.toThrow(
      'REDIRECT:/login?reason=phone-registered&workspace=home-one',
    );
    expect(logWarnMock).toHaveBeenCalledWith({ code: 'UNKNOWN' }, 'onboarding abandon failed');
    expect(clearFlowMock).toHaveBeenCalledTimes(1);
  });
});
