'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ErrorScreen } from '@/components/carelink/ErrorScreen';

export function RateLimitPanel({ initialSeconds }: { initialSeconds: number }) {
  const router = useRouter();
  const [seconds, setSeconds] = React.useState(Math.max(0, initialSeconds));

  React.useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  return (
    <ErrorScreen
      code="RATE_LIMIT"
      variant="rate-limit"
      retryAfterSeconds={seconds}
      primaryAction={{
        label: 'Войти снова',
        disabled: seconds > 0,
        onClick: () => router.push('/login'),
      }}
      secondaryAction={{
        label: 'Восстановить доступ через семью',
        onClick: () => router.push('/login'),
      }}
    />
  );
}
