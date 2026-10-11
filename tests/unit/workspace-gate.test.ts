import { describe, expect, it } from 'vitest';
import {
  canSubmitOnboardingWorkspace,
  isSlugAvailabilityOk,
  shouldApplyServerSlugToInput,
} from '@/lib/forms/workspace-gate';

describe('workspace-gate', () => {
  it('isSlugAvailabilityOk only when check finished available', () => {
    expect(isSlugAvailabilityOk({ phase: 'idle' })).toBe(false);
    expect(isSlugAvailabilityOk({ phase: 'checking' })).toBe(false);
    expect(isSlugAvailabilityOk({ phase: 'done', result: { status: 'taken' } })).toBe(false);
    expect(isSlugAvailabilityOk({ phase: 'done', result: { status: 'available' } })).toBe(true);
  });

  it('canSubmitOnboardingWorkspace requires schema, availability, not pending', () => {
    const slug = 'ivanovy';
    const name = 'Семья';
    const available = { phase: 'done' as const, result: { status: 'available' } };
    expect(canSubmitOnboardingWorkspace(slug, name, available, false)).toBe(true);
    expect(canSubmitOnboardingWorkspace(slug, name, { phase: 'checking' }, false)).toBe(false);
    expect(canSubmitOnboardingWorkspace('ab', name, available, false)).toBe(false);
    expect(canSubmitOnboardingWorkspace(slug, '', available, false)).toBe(false);
    expect(canSubmitOnboardingWorkspace(slug, name, available, true)).toBe(false);
  });

  it('never overwrites slug input from server response while typing (P2 #19)', () => {
    expect(shouldApplyServerSlugToInput('server-slug', 'user-typing')).toBe(false);
  });
});
