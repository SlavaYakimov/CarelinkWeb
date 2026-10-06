import 'server-only';

/** Reads `sub` from a JWT access token without signature verification (gateway-issued). */
export function userIdFromAccessToken(access: string): string | null {
  const parts = access.split('.');
  const body = parts[1];
  if (!body) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      sub?: unknown;
    };
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
