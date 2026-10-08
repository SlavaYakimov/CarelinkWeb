import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/carelink/LoginForm';
import { formatWorkspaceLogin, isValidWorkspaceSlug } from '@/lib/workspace-slug';
import { sanitizeNextParam } from '@/server/security/next-param';
import { getSession } from '@/server/session/get-session';

type PageProps = {
  searchParams: Promise<{ next?: string; reason?: string; workspace?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await getSession();
  const params = await searchParams;
  const nextPath = sanitizeNextParam(params.next);

  if (session) {
    redirect(nextPath);
  }

  const notice = params.reason === 'phone-registered' ? 'phone-registered' : undefined;
  const workspace = typeof params.workspace === 'string' ? params.workspace : undefined;
  const defaultEmail =
    workspace && isValidWorkspaceSlug(workspace) ? formatWorkspaceLogin(workspace) : undefined;

  return <LoginForm nextPath={nextPath} notice={notice} defaultEmail={defaultEmail} />;
}
