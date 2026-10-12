import { describe, expect, it } from 'vitest';
import {
  getInviteErrorMessage,
  INVITE_EMAIL_NOT_AVAILABLE_MESSAGE,
  INVITE_RATE_LIMIT_MESSAGE,
} from '@/lib/invites/error-messages';
import { toFormState } from '@/lib/forms/to-form-state';

describe('invite error messages', () => {
  it('maps NOT_IMPLEMENTED to invite-specific copy', () => {
    expect(getInviteErrorMessage('NOT_IMPLEMENTED')).toBe(INVITE_EMAIL_NOT_AVAILABLE_MESSAGE);
    expect(getInviteErrorMessage('RATE_LIMIT')).toBe(INVITE_RATE_LIMIT_MESSAGE);
  });

  it('surfaces NOT_IMPLEMENTED on form banner for invite field map', () => {
    const mapped = toFormState(
      { code: 'NOT_IMPLEMENTED', status: 501 },
      { NOT_IMPLEMENTED: 'form' },
      getInviteErrorMessage,
    );
    expect(mapped.formError).toBe(INVITE_EMAIL_NOT_AVAILABLE_MESSAGE);
  });
});
