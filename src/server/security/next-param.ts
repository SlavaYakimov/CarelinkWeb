const DEFAULT_SAFE = '/families';

/**
 * Validates `next` query param against open redirects (§1.8, §4.10).
 */
export function sanitizeNextParam(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_SAFE;
  const value = raw.trim();
  if (!value.startsWith('/')) return DEFAULT_SAFE;
  if (value.startsWith('//')) return DEFAULT_SAFE;
  if (value.includes('://')) return DEFAULT_SAFE;
  if (value.includes('\\')) return DEFAULT_SAFE;
  return value;
}
