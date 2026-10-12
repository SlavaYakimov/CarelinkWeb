'use client';

import * as React from 'react';
import type { z } from 'zod';

export type UseFormGateOptions = {
  pending?: boolean;
  /** Resend / rate-limit cooldown blocks submit */
  cooldownActive?: boolean;
  /** Extra client checks (e.g. slug availability) */
  extraOk?: boolean;
};

export type FormGateResult = {
  canSubmit: boolean;
  /** Zod field errors (flattened first message) */
  clientFieldErrors: Record<string, string | undefined>;
  touch: (field: string) => void;
  touchAll: () => void;
  showError: (field: string) => boolean;
};

export function useFormGate<S extends z.ZodTypeAny>(
  schema: S,
  values: z.input<S>,
  fieldNames: string[],
  { pending = false, cooldownActive = false, extraOk = true }: UseFormGateOptions = {},
): FormGateResult {
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const parsed = schema.safeParse(values);
  const flat = parsed.success ? {} : parsed.error.flatten().fieldErrors;

  const clientFieldErrors: Record<string, string | undefined> = {};
  for (const name of fieldNames) {
    const msgs = flat[name as keyof typeof flat];
    clientFieldErrors[name] = Array.isArray(msgs) ? msgs[0] : undefined;
  }

  const canSubmit = parsed.success && !pending && !cooldownActive && extraOk;

  const touch = React.useCallback((field: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
  }, []);

  const touchAll = React.useCallback(() => {
    setSubmitted(true);
    setTouched(Object.fromEntries(fieldNames.map((f) => [f, true])));
  }, [fieldNames]);

  const showError = React.useCallback(
    (field: string) => Boolean(clientFieldErrors[field] && (touched[field] || submitted)),
    [clientFieldErrors, touched, submitted],
  );

  return { canSubmit, clientFieldErrors, touch, touchAll, showError };
}
