'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';

export type FormAlertProps = {
  message: string;
  tabIndex?: number;
};

/** Banner for errors without a specific field (network, 5xx, rate limit). */
export function FormAlert({ message, tabIndex = -1 }: FormAlertProps) {
  return (
    <Alert variant="destructive" role="alert" tabIndex={tabIndex}>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
