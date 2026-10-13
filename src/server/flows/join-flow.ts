import 'server-only';
import { redirect } from 'next/navigation';
import { clearFlowCookie, readFlowCookie, setFlowCookie } from '@/server/session/cookies';
import { deleteFlow, loadFlow, newFlowId, saveFlow } from '@/server/session/store';
import type { FlowRecord } from '@/server/session/types';

export async function readJoinFlow(): Promise<{ fid: string; flow: FlowRecord } | null> {
  const fid = await readFlowCookie();
  if (!fid) return null;
  const flow = await loadFlow(fid);
  if (!flow || flow.kind !== 'join') return null;
  return { fid, flow };
}

export async function persistJoinFlow(fid: string, flow: FlowRecord): Promise<void> {
  await saveFlow(fid, flow);
  await setFlowCookie(fid);
}

export async function startJoinFlow(partial: Partial<FlowRecord> = {}): Promise<string> {
  const fid = newFlowId();
  const flow: FlowRecord = {
    kind: 'join',
    step: 'email',
    createdAt: new Date().toISOString(),
    ...partial,
  };
  await persistJoinFlow(fid, flow);
  return fid;
}

export async function clearJoinFlow(fid?: string): Promise<void> {
  const id = fid ?? (await readFlowCookie());
  if (id) await deleteFlow(id);
  await clearFlowCookie();
}

export async function requireJoinFlow(step?: string): Promise<{ fid: string; flow: FlowRecord }> {
  const ctx = await readJoinFlow();
  if (!ctx) redirect('/join/email');
  if (step && ctx.flow.step !== step) {
    redirect(joinStepPath(ctx.flow.step));
  }
  return ctx;
}

export function joinStepPath(step: string | undefined): string {
  switch (step) {
    case 'email':
      return '/join/email';
    case 'verify':
      return '/invites/email/verify';
    case 'choice':
      return '/join/choice';
    case 'taken':
      return '/invites/email/taken';
    case 'qr':
      return '/join';
    case 'pending':
      return '/join/pending';
    case 'recovery-email':
      return '/join/recovery-email';
    case 'create-family':
      return '/join/create-family';
    default:
      return '/join/email';
  }
}
