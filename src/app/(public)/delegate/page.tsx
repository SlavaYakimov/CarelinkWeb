import { redirect } from 'next/navigation';
import { DelegateApprovalCard } from '@/components/carelink/DelegateApprovalCard';
import { delegateUnavailablePath } from '@/lib/delegate-errors';
import { loadDelegateDetailsForKeeper } from '@/server/actions/delegate-approval';
import { requireDelegateToken, stashDelegateToken } from '@/server/flows/delegate-flow';
import { handleDelegateGatewayError } from '@/server/flows/delegate-errors';
import { getSession } from '@/server/session/get-session';

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function DelegatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  if (params.token !== undefined) {
    const trimmed = params.token.trim();
    if (!trimmed) {
      redirect(delegateUnavailablePath('bad-request'));
    }
    await stashDelegateToken(trimmed);
    redirect('/delegate');
  }

  const session = await getSession();
  if (!session) {
    redirect('/login?next=%2Fdelegate');
  }

  const { token } = await requireDelegateToken();

  try {
    const details = await loadDelegateDetailsForKeeper(token);
    return (
      <DelegateApprovalCard
        memberDisplayName={details.memberDisplayName}
        familyName={details.familyName}
        platform={details.platform}
        clientDeviceId={details.clientDeviceId}
        requestedAt={details.requestedAt}
        expiresAt={details.expiresAt}
      />
    );
  } catch (err) {
    handleDelegateGatewayError(err);
  }
}
