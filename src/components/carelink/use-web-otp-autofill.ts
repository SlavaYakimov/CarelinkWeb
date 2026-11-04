'use client';

import * as React from 'react';
import { isWebOtpSupported, readWebOtpCode } from '@/lib/client/web-otp';

export function useWebOtpAutofill(
  enabled: boolean,
  value: string,
  onCode: (digits: string) => void,
): void {
  const onCodeRef = React.useRef(onCode);
  React.useEffect(() => {
    onCodeRef.current = onCode;
  });

  React.useEffect(() => {
    if (!enabled || value.length > 0) return;
    if (!isWebOtpSupported()) return;

    const ac = new AbortController();
    void readWebOtpCode({ signal: ac.signal }).then((code) => {
      if (code) onCodeRef.current(code);
    });

    return () => ac.abort();
  }, [enabled, value.length]);
}
