export const WORKSPACE_LOGIN_DOMAIN = 'workspaces.carelink.app';

export function normalizeWorkspaceSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Slug segment while typing/pasting a workspace login (local part before `@`). */
export function slugFromWorkspaceLoginInput(value: string): string {
  const trimmed = value.trim();
  const at = trimmed.indexOf('@');
  if (at > 0) {
    return normalizeWorkspaceSlug(trimmed.slice(0, at));
  }
  return normalizeWorkspaceSlug(trimmed);
}

/** Normalizes slug field input, including partial workspace-email typing (no `@` left in value). */
export function coerceWorkspaceSlugFieldInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) {
    return slugFromWorkspaceLoginInput(trimmed);
  }
  if (/workspaces|carelink|@|\.app|app$/i.test(trimmed)) {
    const pasted = trimmed.match(
      /^([a-z0-9-]{3,32}?)(?:workspaces\.carelink\.app|workspaces|carelink|\.app|app)+$/i,
    );
    if (pasted) {
      return normalizeWorkspaceSlug(pasted[1]!);
    }
    const lower = trimmed.toLowerCase();
    const suffixMarkers = ['workspaces', 'carelink', '.app', 'app'];
    const cutAt = suffixMarkers.map((marker) => lower.indexOf(marker)).filter((idx) => idx > 0);
    if (cutAt.length > 0) {
      return normalizeWorkspaceSlug(trimmed.slice(0, Math.min(...cutAt)));
    }
  }
  return raw;
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
