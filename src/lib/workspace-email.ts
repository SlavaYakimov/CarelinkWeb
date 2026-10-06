/** Normalizes workspace login input (trim, lower-case local part domain). */
export function normalizeWorkspaceEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isPlausibleWorkspaceEmail(value: string): boolean {
  const v = normalizeWorkspaceEmail(value);
  if (v.length < 5 || v.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
