import messages from '../../messages/ru.json';

type ErrorCode = keyof typeof messages.errors;

export function getErrorMessage(code: string | undefined | null): string {
  if (!code) return messages.errors.UNKNOWN;
  const key = code as ErrorCode;
  return messages.errors[key] ?? messages.errors.UNKNOWN;
}

export function getValidationMessage(key: keyof typeof messages.validation): string {
  return messages.validation[key];
}
