import 'server-only';
import { redirect } from 'next/navigation';
import { clearFlowCookie, readFlowCookie, setFlowCookie } from '@/server/session/cookies';
import { deleteFlow, loadFlow, newFlowId, saveFlow } from '@/server/session/store';
import type { FlowRecord } from '@/server/session/types';

const INVITE_CODE_MIN = 8;
const INVITE_CODE_MAX = 128;

export function normalizeInviteCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim();
  if (code.length < INVITE_CODE_MIN || code.length > INVITE_CODE_MAX) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(code)) return null;
  return code;
}

export async function readInviteFlow(): Promise<{ fid: string; flow: FlowRecord } | null> {
  const fid = await readFlowCookie();
  if (!fid) return null;
  const flow = await loadFlow(fid);
  if (!flow || flow.kind !== 'invite') return null;
  return { fid, flow };
}

export async function persistInviteFlow(fid: string, flow: FlowRecord): Promise<void> {
  await saveFlow(fid, flow);
  await setFlowCookie(fid);
}

export async function startInviteFlow(inviteCode: string): Promise<void> {
  const code = normalizeInviteCode(inviteCode);
  if (!code) {
    redirect('/invite/unavailable?reason=invalid_code');
  }
  const fid = newFlowId();
  const flow: FlowRecord = {
    kind: 'invite',
    step: 'landing',
    inviteCode: code,
    createdAt: new Date().toISOString(),
  };
  await persistInviteFlow(fid, flow);
}

export async function clearInviteFlow(fid?: string): Promise<void> {
  const id = fid ?? (await readFlowCookie());
  if (id) await deleteFlow(id);
  await clearFlowCookie();
}
