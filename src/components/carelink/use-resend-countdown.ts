'use client';

import * as React from 'react';

export type UseResendCountdownOptions = {
  /** ISO time of last successful send; change restarts the timer */
  successAt?: string | null;
  /** Start countdown on mount (code already sent server-side) */
  startOnMount?: boolean;
  seconds?: number;
};

export type ResendCountdown = {
  secondsLeft: number;
  label: string;
  /** Apply server retryAfter after a failed resend (429) */
  applyRetryAfter: (seconds: number) => void;
};

export function useResendCountdown({
  successAt,
  startOnMount = false,
  seconds = 60,
}: UseResendCountdownOptions): ResendCountdown {
  const [secondsLeft, setSecondsLeft] = React.useState(startOnMount ? seconds : 0);
  const lastSuccessAt = React.useRef<string | null | undefined>(undefined);
  const running = secondsLeft > 0;

  React.useEffect(() => {
    if (!successAt) return;
    if (successAt === lastSuccessAt.current) return;
    lastSuccessAt.current = successAt;
    setSecondsLeft(seconds);
  }, [successAt, seconds]);

  React.useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const applyRetryAfter = React.useCallback((retrySeconds: number) => {
    setSecondsLeft(Math.max(0, Math.floor(retrySeconds)));
  }, []);

  return {
    secondsLeft,
    label: formatMmSs(secondsLeft),
    applyRetryAfter,
  };
}

export function formatMmSs(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
