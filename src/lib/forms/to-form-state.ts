import { getErrorMessage } from '@/lib/messages';

export type GatewayErrorLike = {
  code: string;
  status: number;
  retryAfter?: number;
};

export type FormStateFromGateway = {
  formError?: string;
  fieldErrors?: Record<string, string>;
  retryAfter?: number;
};

export type GatewayFieldMap = Record<string, string>;

/** Default gateway code → form field name (banner omitted when mapped). */
export const DEFAULT_GATEWAY_FIELD_MAP: GatewayFieldMap = {
  INVALID_OTP: 'code',
  INVALID_CREDENTIALS: 'password',
  WORKSPACE_NOT_FOUND: 'workspaceSlug',
  WEAK_PASSWORD: 'newPassword',
  WORKSPACE_SLUG_TAKEN: 'workspaceSlug',
  EMAIL_TAKEN: 'email',
  PHONE_REGISTERED: 'phone',
  INVALID_ARGUMENT: 'form',
};

const BANNER_CODES = new Set([
  'RATE_LIMIT',
  'INTERNAL',
  'UNKNOWN',
  'OFFLINE',
  'STORAGE_UNAVAILABLE',
  'UNAUTHORIZED',
  'TOKEN_EXPIRED',
  'NOT_IMPLEMENTED',
  'CONTRACT_MISMATCH',
]);

function isNetworkOrServer(status: number): boolean {
  return status >= 500 || status === 0;
}

/**
 * Maps a gateway error to form field errors or a banner message.
 * Field-targeted codes never duplicate into formError.
 */
export function toFormState(
  err: GatewayErrorLike,
  fieldMap: GatewayFieldMap = DEFAULT_GATEWAY_FIELD_MAP,
  messageForCode: (code: string) => string = getErrorMessage,
): FormStateFromGateway {
  const message = messageForCode(err.code);
  const retryAfter = err.retryAfter;

  if (err.code === 'RATE_LIMIT') {
    return {
      formError: message,
      retryAfter: retryAfter ?? 60,
    };
  }

  if (isNetworkOrServer(err.status) || BANNER_CODES.has(err.code)) {
    if (fieldMap[err.code] && fieldMap[err.code] !== 'form') {
      const field = fieldMap[err.code]!;
      return { fieldErrors: { [field]: message }, retryAfter };
    }
    return { formError: message, retryAfter };
  }

  const field = fieldMap[err.code];
  if (field && field !== 'form') {
    return { fieldErrors: { [field]: message }, retryAfter };
  }

  if (err.code === 'INVALID_CREDENTIALS' || err.code === 'WORKSPACE_NOT_FOUND') {
    return { fieldErrors: { password: message } };
  }

  return { formError: message, retryAfter };
}

/** Flattens zod field errors to a single string per field. */
export function zodFieldErrors(flat: Record<string, string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    const first = messages?.[0];
    if (first) out[key] = first;
  }
  return out;
}
