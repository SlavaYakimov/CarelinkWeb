import { ChangePasswordForm } from '@/components/carelink/ChangePasswordForm';
import { requireSignInFlow } from '@/server/flows/signin-flow';
import { sanitizeNextParam } from '@/server/security/next-param';

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function ChangePasswordPage({ searchParams }: PageProps) {
  const { flow } = await requireSignInFlow('change-password');
  const params = await searchParams;
  const nextPath = sanitizeNextParam(params.next);
  const workspaceEmail = flow.workspaceEmail ?? '';

  return <ChangePasswordForm workspaceEmail={workspaceEmail} nextPath={nextPath} />;
}
