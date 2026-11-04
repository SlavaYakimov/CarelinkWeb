import { describe, expect, it } from 'vitest';
import { mergeFieldError } from '@/lib/forms/client-field-error';
import type { FormGateResult } from '@/lib/forms/use-form-gate';

function gate(partial: Partial<FormGateResult>): FormGateResult {
  return {
    canSubmit: false,
    clientFieldErrors: {},
    touch: () => {},
    touchAll: () => {},
    showError: () => false,
    ...partial,
  };
}

describe('mergeFieldError', () => {
  it('prefers server error', () => {
    const g = gate({ showError: () => true, clientFieldErrors: { x: 'client' } });
    expect(mergeFieldError(g, 'x', 'server')).toBe('server');
  });

  it('shows client error when touched', () => {
    const g = gate({ showError: () => true, clientFieldErrors: { x: 'client' } });
    expect(mergeFieldError(g, 'x')).toBe('client');
  });

  it('hides client error before touch', () => {
    const g = gate({ showError: () => false, clientFieldErrors: { x: 'client' } });
    expect(mergeFieldError(g, 'x')).toBeUndefined();
  });
});
