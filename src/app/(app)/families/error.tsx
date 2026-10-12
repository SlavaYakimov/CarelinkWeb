'use client';

import { AppRouteError } from '@/components/carelink/AppRouteError';

export default function FamiliesError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppRouteError
      {...props}
      title="Не удалось открыть «Мои семьи»"
      description="Попробуйте обновить страницу или вернитесь позже."
    />
  );
}
