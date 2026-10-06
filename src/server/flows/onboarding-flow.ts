import 'server-only';
import { redirect } from 'next/navigation';
import { clearFlowCookie, readFlowCookie, setFlowCookie } from '@/server/session/cookies';
import { deleteFlow, loadFlow, saveFlow } from '@/server/session/store';
import type { FlowRecord } from '@/server/session/types';

export async function readOnboardingFlow(): Promise<{ fid: string; flow: FlowRecord } | null> {
  const fid = await readFlowCookie();
  if (!fid) return null;
  const flow = await loadFlow(fid);
  if (!flow || flow.kind !== 'onboarding') return null;
  return { fid, flow };
}

export async function requireOnboardingFlow(
  step?: string,
): Promise<{ fid: string; flow: FlowRecord }> {
  const ctx = await readOnboardingFlow();
  if (!ctx) redirect('/onboarding/email');
  if (step && ctx.flow.step !== step) redirect('/onboarding/email');
  return ctx;
}

export async function persistOnboardingFlow(fid: string, flow: FlowRecord): Promise<void> {
  await saveFlow(fid, flow);
  await setFlowCookie(fid);
}

export async function clearOnboardingFlow(fid?: string): Promise<void> {
  const id = fid ?? (await readFlowCookie());
  if (id) await deleteFlow(id);
  await clearFlowCookie();
}

export function onboardingStepPath(step: string | undefined): string {
  switch (step) {
    case 'email':
      return '/onboarding/email';
    case 'phone':
      return '/onboarding/phone';
    case 'device':
      return '/onboarding/device';
    case 'password':
      return '/onboarding/password';
    case 'workspace':
      return '/onboarding/workspace';
    case 'done':
      return '/onboarding/done';
    default:
      return '/onboarding/email';
  }
}
