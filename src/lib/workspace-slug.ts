export function normalizeWorkspaceSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidWorkspaceSlug(slug: string): boolean {
  const s = normalizeWorkspaceSlug(slug);
  if (s.length < 3 || s.length > 32) return false;
  if (!/^[a-z0-9-]+$/.test(s)) return false;
  if (s.startsWith('-') || s.endsWith('-')) return false;
  return true;
}

export function formatWorkspaceLogin(slug: string): string {
  return `${normalizeWorkspaceSlug(slug)}@workspaces.carelink.app`;
}

/** Strips separators from email OTP (XXX-XXX → 6 digits). */
export function normalizeEmailOtp(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 6);
}
