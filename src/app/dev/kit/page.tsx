import { notFound } from 'next/navigation';
import { DevKitShowcase } from './DevKitShowcase';

export const dynamic = 'force-dynamic';

export default function DevKitPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }
  return <DevKitShowcase />;
}
