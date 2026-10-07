export const WORKSPACE_LOGIN_DOMAIN = 'workspaces.carelink.app';

export function normalizeWorkspaceSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

/** For login forms: full workspace email or bare slug → slug for the input. */
export function parseWorkspaceSlugFromLogin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const at = trimmed.indexOf('@');
  if (at > 0) {
    const local = trimmed.slice(0, at).trim();
    const domain = trimmed
      .slice(at + 1)
      .trim()
      .toLowerCase();
    if (domain === WORKSPACE_LOGIN_DOMAIN) {
      return normalizeWorkspaceSlug(local);
    }
  }
  return normalizeWorkspaceSlug(trimmed);
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
