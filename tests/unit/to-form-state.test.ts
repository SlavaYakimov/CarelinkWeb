import { describe, expect, it } from 'vitest';
import { toFormState } from '@/lib/forms/to-form-state';

describe('toFormState', () => {
  it('maps INVALID_OTP to code field without banner', () => {
    const r = toFormState({ code: 'INVALID_OTP', status: 400 });
    expect(r.fieldErrors?.code).toBeTruthy();
    expect(r.formError).toBeUndefined();
  });

  it('maps INVALID_CREDENTIALS to password only', () => {
    const r = toFormState({ code: 'INVALID_CREDENTIALS', status: 401 });
    expect(r.fieldErrors?.password).toBeTruthy();
    expect(r.formError).toBeUndefined();
  });

  it('maps RATE_LIMIT to banner with retryAfter', () => {
    const r = toFormState({ code: 'RATE_LIMIT', status: 429, retryAfter: 30 });
    expect(r.formError).toBeTruthy();
    expect(r.retryAfter).toBe(30);
  });

  it('maps WORKSPACE_SLUG_TAKEN to workspaceSlug', () => {
    const r = toFormState({ code: 'WORKSPACE_SLUG_TAKEN', status: 409 });
    expect(r.fieldErrors?.workspaceSlug).toBeTruthy();
  });
});
