'use client';

import { AppRouteError } from '@/components/carelink/AppRouteError';

export default function AppSectionError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppRouteError {...props} />;
}
