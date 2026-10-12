import { notFound } from 'next/navigation';
import { DevKitShowcase } from './DevKitShowcase';

export const dynamic = 'force-dynamic';

export default function DevKitPage() {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.APP_ENV === 'production' ||
    process.env.APP_ENV === 'prod'
  ) {
    notFound();
  }
  return <DevKitShowcase />;
}
