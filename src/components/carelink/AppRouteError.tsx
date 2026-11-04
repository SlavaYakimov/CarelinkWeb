'use client';

import * as React from 'react';
import { ErrorScreen } from '@/components/carelink/ErrorScreen';

export type AppRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
};

export function AppRouteError({
  error,
  reset,
  title = 'Что-то пошло не так',
  description = 'Не удалось загрузить страницу. Попробуйте ещё раз.',
}: AppRouteErrorProps) {
  React.useEffect(() => {
    if (error.digest) {
      console.error(`route_error digest=${error.digest}`);
    }
  }, [error.digest]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <ErrorScreen
        code="APP_ERROR"
        title={title}
        description={description}
        primaryAction={{ label: 'Повторить', onClick: () => reset() }}
      />
    </div>
  );
}
