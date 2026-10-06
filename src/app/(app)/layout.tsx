import { redirect } from 'next/navigation';
import { AppShell } from '@/components/carelink/AppShell';
import { getSession } from '@/server/session/get-session';

export default async function AppSectionLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSession();
  if (!ctx) {
    redirect('/session-ended');
  }
  return <AppShell>{children}</AppShell>;
}
