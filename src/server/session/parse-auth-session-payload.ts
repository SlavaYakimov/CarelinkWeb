import 'server-only';
import type { components } from '@/server/gateway/types.gen';

type AuthSession = components['schemas']['AuthSessionResponse'];

export class InvalidAuthSessionPayloadError extends Error {
  override name = 'InvalidAuthSessionPayloadError';
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function readExpiresAt(raw: unknown): number | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const ms = Date.parse(raw);
    if (!Number.isNaN(ms)) return ms;
  }
  return undefined;
}

function parseFamilyBundle(raw: unknown): AuthSession['families'][number] | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const familyId = readString(row, 'familyId', 'family_id');
  const access = readString(row, 'access');
  const refresh = readString(row, 'refresh');
  const expiresAt = readExpiresAt(row.expiresAt ?? row.expires_at);
  if (!familyId || !access || !refresh || expiresAt === undefined) {
    return null;
  }
  return { familyId, access, refresh, expiresAt };
}

/** Accept AuthSessionResponse or `{ session: AuthSessionResponse }` from rebuild. */
export function parseAuthSessionPayload(payload: unknown): AuthSession {
  let raw: unknown = payload;
  if (raw && typeof raw === 'object' && 'session' in raw) {
    raw = (raw as { session: unknown }).session;
  }
  if (!raw || typeof raw !== 'object') {
    throw new InvalidAuthSessionPayloadError('auth session payload is not an object');
  }
  const record = raw as Record<string, unknown>;
  const defaultFamilyId = readString(record, 'defaultFamilyId', 'default_family_id');
  const userRefresh = readString(record, 'userRefresh', 'user_refresh');
  if (!defaultFamilyId || !userRefresh) {
    throw new InvalidAuthSessionPayloadError('auth session missing defaultFamilyId or userRefresh');
  }

  const familiesIn = record.families;
  const families: AuthSession['families'] = [];
  if (Array.isArray(familiesIn)) {
    for (const item of familiesIn) {
      const bundle = parseFamilyBundle(item);
      if (bundle) families.push(bundle);
    }
  }

  return { defaultFamilyId, userRefresh, families };
}
