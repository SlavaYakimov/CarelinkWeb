import { describe, it, expect } from 'vitest';
import { isValidWorkspaceSlug } from '@/lib/workspace-slug';

/** Mirrors submit gating in OnboardingWorkspaceForm (keep in sync manually). */
function canSubmitSlug(
  slug: string,
  check: { phase: string; result?: { status: string } },
  pending: boolean,
): boolean {
  if (pending) return false;
  if (!slug.trim() || !isValidWorkspaceSlug(slug)) return false;
  if (check.phase === 'checking') return false;
  if (check.phase === 'done') {
    return check.result?.status === 'available';
  }
  return false;
}

describe('OnboardingWorkspaceForm submit gating', () => {
  it('blocks submit while checking or when slug is taken', () => {
    expect(canSubmitSlug('ivanovy', { phase: 'checking' }, false)).toBe(false);
    expect(canSubmitSlug('ivanovy', { phase: 'done', result: { status: 'taken' } }, false)).toBe(
      false,
    );
    expect(
      canSubmitSlug('ivanovy', { phase: 'done', result: { status: 'available' } }, false),
    ).toBe(true);
  });

  it('blocks invalid slug before server check', () => {
    expect(canSubmitSlug('ab', { phase: 'idle' }, false)).toBe(false);
  });
});
