import type { FormGateResult } from '@/lib/forms/use-form-gate';

/** Server action errors win; otherwise show zod client error after touch/submit. */
export function mergeFieldError(
  gate: FormGateResult,
  field: string,
  serverError?: string,
): string | undefined {
  if (serverError) return serverError;
  if (gate.showError(field)) return gate.clientFieldErrors[field];
  return undefined;
}
