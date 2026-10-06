import { KeeperWaitPanel } from '@/components/carelink/KeeperWaitPanel';
import { requireSignInFlow } from '@/server/flows/signin-flow';
import { sanitizeNextParam } from '@/server/security/next-param';

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginKeeperPage({ searchParams }: PageProps) {
  const { flow } = await requireSignInFlow('keeper-wait');
  const params = await searchParams;
  const nextPath = sanitizeNextParam(params.next);

  return (
    <KeeperWaitPanel
      workspaceEmail={flow.workspaceEmail}
      nextPath={nextPath}
      pushAlreadySent={Boolean(flow.delegatePushSentAt)}
    />
  );
}
