import 'server-only';
import { redirect } from 'next/navigation';
import { clearFlowCookie, readFlowCookie, setFlowCookie } from '@/server/session/cookies';
import {
  decryptFlowSecret,
  deleteFlow,
  encryptFlowSecret,
  loadFlow,
  newFlowId,
  saveFlow,
} from '@/server/session/store';
import type { FlowRecord } from '@/server/session/types';

export async function stashDelegateToken(token: string): Promise<void> {
  const fid = newFlowId();
  const flow: FlowRecord = {
    kind: 'delegate',
    step: 'review',
    delegateTokenEnc: encryptFlowSecret(token),
    createdAt: new Date().toISOString(),
  };
  await saveFlow(fid, flow);
  await setFlowCookie(fid);
}

export async function readDelegateFlow(): Promise<{
  fid: string;
  flow: FlowRecord;
  token: string;
} | null> {
  const fid = await readFlowCookie();
  if (!fid) return null;
  const flow = await loadFlow(fid);
  if (!flow || flow.kind !== 'delegate' || !flow.delegateTokenEnc) return null;
  const token = decryptFlowSecret(flow.delegateTokenEnc);
  return { fid, flow, token };
}

export async function requireDelegateToken(): Promise<{ fid: string; token: string }> {
  const ctx = await readDelegateFlow();
  if (!ctx) redirect('/login');
  return { fid: ctx.fid, token: ctx.token };
}

export async function clearDelegateFlow(fid?: string): Promise<void> {
  const id = fid ?? (await readFlowCookie());
  if (id) await deleteFlow(id);
  await clearFlowCookie();
}
