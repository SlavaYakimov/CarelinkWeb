import 'server-only';
import { randomBytes } from 'node:crypto';
import { getEnv } from '@/env';
import { decryptJson, encryptJson } from '@/server/session/crypto';
import { parseDurationToSeconds } from '@/server/session/duration';
import { getRedis } from '@/server/session/redis';
import type { FlowRecord, SessionRecord } from '@/server/session/types';

const SESS_PREFIX = 'sess:';
const FLOW_PREFIX = 'flow:';
const USER_SIDS_PREFIX = 'user:';

export function newSessionId(): string {
  return randomBytes(32).toString('base64url');
}

export function newFlowId(): string {
  return randomBytes(24).toString('base64url');
}

function sessionTtlSeconds(record: SessionRecord): number {
  const env = getEnv();
  if (record.guestMode) {
    return parseDurationToSeconds(env.SESSION_GUEST_TTL);
  }
  return parseDurationToSeconds(env.SESSION_IDLE_TTL);
}

export async function saveSession(sid: string, record: SessionRecord): Promise<void> {
  const env = getEnv();
  const redis = getRedis();
  const blob = encryptJson(record, env.SESSION_ENC_KEY);
  const ttl = sessionTtlSeconds(record);
  await redis.set(`${SESS_PREFIX}${sid}`, blob, 'EX', ttl);
  await redis.sadd(`${USER_SIDS_PREFIX}${record.userId}:sids`, sid);
}

export async function loadSession(sid: string): Promise<{
  record: SessionRecord;
  needsReencrypt: boolean;
} | null> {
  const env = getEnv();
  const redis = getRedis();
  const blob = await redis.get(`${SESS_PREFIX}${sid}`);
  if (!blob) return null;
  const { data, reencrypt } = decryptJson<SessionRecord>(
    blob,
    env.SESSION_ENC_KEY,
    env.SESSION_ENC_KEY_PREVIOUS,
  );
  return { record: data, needsReencrypt: reencrypt };
}

export async function deleteSession(sid: string, userId?: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`${SESS_PREFIX}${sid}`);
  if (userId) {
    await redis.srem(`${USER_SIDS_PREFIX}${userId}:sids`, sid);
  }
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  const redis = getRedis();
  const key = `${USER_SIDS_PREFIX}${userId}:sids`;
  const sids = await redis.smembers(key);
  if (sids.length === 0) return;
  const pipe = redis.pipeline();
  for (const sid of sids) {
    pipe.del(`${SESS_PREFIX}${sid}`);
  }
  pipe.del(key);
  await pipe.exec();
}

export async function saveFlow(fid: string, record: FlowRecord): Promise<void> {
  const env = getEnv();
  const redis = getRedis();
  const blob = encryptJson(record, env.SESSION_ENC_KEY);
  const ttl = parseDurationToSeconds(env.FLOW_TTL);
  await redis.set(`${FLOW_PREFIX}${fid}`, blob, 'EX', ttl);
}

export async function loadFlow(fid: string): Promise<FlowRecord | null> {
  const env = getEnv();
  const redis = getRedis();
  const blob = await redis.get(`${FLOW_PREFIX}${fid}`);
  if (!blob) return null;
  const { data } = decryptJson<FlowRecord>(blob, env.SESSION_ENC_KEY, env.SESSION_ENC_KEY_PREVIOUS);
  return data;
}

export async function deleteFlow(fid: string): Promise<void> {
  await getRedis().del(`${FLOW_PREFIX}${fid}`);
}

/** Stores encrypted password blob in flow (caller encrypts with session crypto). */
export function encryptFlowSecret(value: string): string {
  return encryptJson({ v: value }, getEnv().SESSION_ENC_KEY);
}

export function decryptFlowSecret(blob: string): string {
  const { data } = decryptJson<{ v: string }>(
    blob,
    getEnv().SESSION_ENC_KEY,
    getEnv().SESSION_ENC_KEY_PREVIOUS,
  );
  return data.v;
}
