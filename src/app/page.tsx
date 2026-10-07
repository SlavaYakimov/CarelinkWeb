import { redirect } from 'next/navigation';
import { getSession } from '@/server/session/get-session';

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect('/families');
  }
  redirect('/login');
}
