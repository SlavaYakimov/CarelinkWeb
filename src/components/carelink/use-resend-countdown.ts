'use client';

import * as React from 'react';

export type UseResendCountdownOptions = {
  startOnMount: boolean;
  trigger: boolean | undefined;
  seconds?: number;
};

export type ResendCountdown = {
  secondsLeft: number;
  restart: () => void;
  label: string;
};

export function useResendCountdown({
  startOnMount,
  trigger,
  seconds = 60,
}: UseResendCountdownOptions): ResendCountdown {
  const [secondsLeft, setSecondsLeft] = React.useState(startOnMount ? seconds : 0);
  const running = secondsLeft > 0;

  React.useEffect(() => {
    if (trigger) setSecondsLeft(seconds);
  }, [trigger, seconds]);

  React.useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const restart = React.useCallback(() => setSecondsLeft(seconds), [seconds]);

  return { secondsLeft, restart, label: formatMmSs(secondsLeft) };
}

export function formatMmSs(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
