import { redirect } from 'next/navigation';
import { getSession } from '@/server/session/get-session';

export default async function AppSectionLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSession();
  if (!ctx) {
    redirect('/login');
  }
  return <>{children}</>;
}
