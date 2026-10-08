import 'server-only';
import { gatewayFetch } from '@/server/gateway/client';
import type { components } from '@/server/gateway/types.gen';

const V2_AUTH = '/v2/auth';

type GatewayCtx = {
  clientIp: string;
  deviceId: string;
  traceId?: string;
  deviceSession?: string;
  accessToken?: string;
  userRefresh?: string;
  sid?: string;
  session?: import('@/server/session/types').SessionRecord;
};

type OnboardingRequestEmailRequest = components['schemas']['OnboardingRequestEmailRequest'];
type OnboardingSentResponse = components['schemas']['OnboardingSentResponse'];
type OnboardingVerifyEmailRequest = components['schemas']['OnboardingVerifyEmailRequest'];
type OnboardingVerifyEmailResponse = components['schemas']['OnboardingVerifyEmailResponse'];
type OnboardingRequestPhoneOtpRequest = components['schemas']['OnboardingRequestPhoneOtpRequest'];
type OnboardingVerifyPhoneRequest = components['schemas']['OnboardingVerifyPhoneRequest'];
type OnboardingVerifyPhoneResponse = components['schemas']['OnboardingVerifyPhoneResponse'];
type OnboardingDeviceVerifySmsRequest = components['schemas']['OnboardingDeviceVerifySmsRequest'];
type OnboardingDeviceVerifySmsConfirmRequest =
  components['schemas']['OnboardingDeviceVerifySmsConfirmRequest'];
type DeviceVerifySessionResponse = components['schemas']['DeviceVerifySessionResponse'];
type OnboardingConfirmDeviceRequest = components['schemas']['OnboardingConfirmDeviceRequest'];
type OnboardingConfirmDeviceResponse = components['schemas']['OnboardingConfirmDeviceResponse'];
type OnboardingSetupPasswordRequest = components['schemas']['OnboardingSetupPasswordRequest'];
type OnboardingSetupPasswordResponse = components['schemas']['OnboardingSetupPasswordResponse'];
type OnboardingCheckWorkspaceSlugRequest = components['schemas']['CheckWorkspaceSlugRequest'];
type OnboardingCheckWorkspaceSlugResponse = components['schemas']['CheckWorkspaceSlugResponse'];
type OnboardingAbandonRequest = components['schemas']['OnboardingAbandonRequest'];
type OnboardingFinalizeWorkspaceRequest =
  components['schemas']['OnboardingFinalizeWorkspaceRequest'];
type OnboardingFinalizeWorkspaceResponse =
  components['schemas']['OnboardingFinalizeWorkspaceResponse'];

export async function onboardingRequestEmail(
  body: OnboardingRequestEmailRequest,
  ctx: GatewayCtx,
): Promise<OnboardingSentResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/onboarding/email/request`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function onboardingVerifyEmail(
  body: OnboardingVerifyEmailRequest,
  ctx: GatewayCtx,
): Promise<OnboardingVerifyEmailResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/onboarding/email/verify`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function onboardingVerifyEmailLink(
  token: string,
  ctx: GatewayCtx,
): Promise<OnboardingVerifyEmailResponse> {
  const q = new URLSearchParams({ token });
  return gatewayFetch(
    { method: 'GET', path: `${V2_AUTH}/onboarding/email/verify-link?${q.toString()}` },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function onboardingRequestPhoneOtp(
  body: OnboardingRequestPhoneOtpRequest,
  ctx: GatewayCtx,
): Promise<OnboardingSentResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/onboarding/phone/request-otp`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function onboardingVerifyPhone(
  body: OnboardingVerifyPhoneRequest,
  ctx: GatewayCtx,
): Promise<OnboardingVerifyPhoneResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/onboarding/phone/verify`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

/** CarelinkAuth `onboardingAbandon` (services/auth/internal/delivery/rest/onboarding_handlers.go), 204. */
export async function onboardingAbandon(
  body: OnboardingAbandonRequest,
  ctx: GatewayCtx,
): Promise<void> {
  await gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/onboarding/abandon`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function onboardingDeviceVerifyRequestSms(
  body: OnboardingDeviceVerifySmsRequest,
  ctx: GatewayCtx,
): Promise<{ sent?: boolean }> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/onboarding/device/verify/request-sms`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function onboardingDeviceVerifyVerifySms(
  body: OnboardingDeviceVerifySmsConfirmRequest,
  ctx: GatewayCtx,
): Promise<DeviceVerifySessionResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/onboarding/device/verify/verify-sms`, body },
    { clientIp: ctx.clientIp, deviceId: ctx.deviceId, traceId: ctx.traceId },
  );
}

export async function onboardingConfirmDevice(
  body: OnboardingConfirmDeviceRequest,
  ctx: GatewayCtx,
): Promise<OnboardingConfirmDeviceResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/onboarding/device/confirm`, body },
    {
      clientIp: ctx.clientIp,
      deviceId: ctx.deviceId,
      traceId: ctx.traceId,
      deviceSession: ctx.deviceSession,
    },
  );
}

export async function onboardingSetupPassword(
  body: OnboardingSetupPasswordRequest,
  ctx: GatewayCtx,
): Promise<OnboardingSetupPasswordResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/onboarding/password/setup`, body },
    {
      clientIp: ctx.clientIp,
      deviceId: ctx.deviceId,
      traceId: ctx.traceId,
      userRefresh: ctx.userRefresh,
    },
  );
}

export async function onboardingCheckWorkspaceSlug(
  body: OnboardingCheckWorkspaceSlugRequest,
  ctx: GatewayCtx,
): Promise<OnboardingCheckWorkspaceSlugResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/onboarding/workspace/check-slug`, body },
    {
      clientIp: ctx.clientIp,
      deviceId: ctx.deviceId,
      traceId: ctx.traceId,
      deviceSession: ctx.deviceSession,
      sid: ctx.sid,
      session: ctx.session,
    },
  );
}

export async function onboardingFinalizeWorkspace(
  body: OnboardingFinalizeWorkspaceRequest,
  ctx: GatewayCtx,
): Promise<OnboardingFinalizeWorkspaceResponse> {
  return gatewayFetch(
    { method: 'POST', path: `${V2_AUTH}/onboarding/workspace/finalize`, body },
    {
      clientIp: ctx.clientIp,
      deviceId: ctx.deviceId,
      traceId: ctx.traceId,
      deviceSession: ctx.deviceSession,
      sid: ctx.sid,
      session: ctx.session,
    },
  );
}
