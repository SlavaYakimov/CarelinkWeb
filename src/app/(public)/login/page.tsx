import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/carelink/LoginForm';
import { sanitizeNextParam } from '@/server/security/next-param';
import { getSession } from '@/server/session/get-session';

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await getSession();
  const params = await searchParams;
  const nextPath = sanitizeNextParam(params.next);

  if (session) {
    redirect(nextPath);
  }

  return <LoginForm nextPath={nextPath} />;
}
