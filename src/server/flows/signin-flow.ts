import 'server-only';
import { redirect } from 'next/navigation';
import { clearFlowCookie, readFlowCookie, setFlowCookie } from '@/server/session/cookies';
import { deleteFlow, loadFlow, saveFlow } from '@/server/session/store';
import type { FlowRecord } from '@/server/session/types';

export async function readSignInFlow(): Promise<{ fid: string; flow: FlowRecord } | null> {
  const fid = await readFlowCookie();
  if (!fid) return null;
  const flow = await loadFlow(fid);
  if (!flow || flow.kind !== 'signin') return null;
  return { fid, flow };
}

export async function requireSignInFlow(step?: string): Promise<{ fid: string; flow: FlowRecord }> {
  const ctx = await readSignInFlow();
  if (!ctx) redirect('/login');
  if (step && ctx.flow.step !== step) redirect('/login');
  return ctx;
}

export async function persistSignInFlow(fid: string, flow: FlowRecord): Promise<void> {
  await saveFlow(fid, flow);
  await setFlowCookie(fid);
}

export async function clearSignInFlow(fid?: string): Promise<void> {
  const id = fid ?? (await readFlowCookie());
  if (id) await deleteFlow(id);
  await clearFlowCookie();
}
