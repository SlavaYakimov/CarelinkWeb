'use client';

import * as React from 'react';

export function useFocusFirstError(
  fieldErrors: Record<string, string | undefined> | undefined,
  formError: string | undefined,
) {
  const prevKey = React.useRef<string>('');

  React.useEffect(() => {
    const entries = Object.entries(fieldErrors ?? {}).filter(([, v]) => Boolean(v));
    const key = entries.map(([k, v]) => `${k}:${v}`).join('|') + (formError ?? '');
    if (!key || key === prevKey.current) return;
    prevKey.current = key;

    if (entries.length > 0) {
      const [field] = entries[0]!;
      const el = document.querySelector<HTMLElement>(`[name="${field}"], #${field}`);
      el?.focus();
      return;
    }
    if (formError) {
      document.querySelector<HTMLElement>('[role="alert"][tabindex="-1"]')?.focus();
    }
  }, [fieldErrors, formError]);
}
