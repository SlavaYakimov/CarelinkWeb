'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function FamiliesLoadError() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  return (
    <Alert variant="destructive" className="max-w-xl">
      <AlertCircle className="size-4" aria-hidden />
      <AlertTitle>Не удалось загрузить семьи</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>Проверьте соединение и попробуйте снова.</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            setPending(true);
            router.refresh();
            window.setTimeout(() => setPending(false), 1500);
          }}
        >
          {pending ? 'Обновляем…' : 'Повторить'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
