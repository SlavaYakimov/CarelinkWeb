import { describe, it, expect } from 'vitest';
import { canSubmitOnboardingWorkspace } from '@/lib/forms/workspace-gate';

describe('OnboardingWorkspaceForm submit gating', () => {
  const displayName = 'Семья Ивановых';

  it('blocks submit while checking or when slug is taken', () => {
    expect(canSubmitOnboardingWorkspace('ivanovy', displayName, { phase: 'checking' }, false)).toBe(
      false,
    );
    expect(
      canSubmitOnboardingWorkspace(
        'ivanovy',
        displayName,
        { phase: 'done', result: { status: 'taken' } },
        false,
      ),
    ).toBe(false);
    expect(
      canSubmitOnboardingWorkspace(
        'ivanovy',
        displayName,
        { phase: 'done', result: { status: 'available' } },
        false,
      ),
    ).toBe(true);
  });

  it('blocks invalid slug before server check', () => {
    expect(canSubmitOnboardingWorkspace('ab', displayName, { phase: 'idle' }, false)).toBe(false);
  });
});
