'use client';

import * as React from 'react';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function OfflineBanner() {
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[90] px-4 pt-2">
      <Alert variant="warning" role="status" className="mx-auto max-w-3xl shadow-card">
        <WifiOff className="size-4" aria-hidden />
        <AlertTitle>Нет соединения</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>Данные могут быть неактуальны. Проверьте сеть.</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Повторить
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
