import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/carelink/AppHeader';
import { getSession } from '@/server/session/get-session';

export default async function AppSectionLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSession();
  if (!ctx) {
    redirect('/session-ended');
  }
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
