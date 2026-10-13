/** Human-readable join code for keeper UI (BE returns opaque joinToken only). */
export function formatJoinLinkShortCode(joinToken: string): string {
  const clean = joinToken.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length >= 7) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
  }
  return clean.slice(0, 8) || '—';
}
