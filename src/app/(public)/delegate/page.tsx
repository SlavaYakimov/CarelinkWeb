import { redirect } from 'next/navigation';
import { DelegateApprovalCard } from '@/components/carelink/DelegateApprovalCard';
import { ErrorScreen } from '@/components/carelink/ErrorScreen';
import { loadDelegateDetailsForKeeper } from '@/server/actions/delegate-approval';
import { requireDelegateToken, stashDelegateToken } from '@/server/flows/delegate-flow';
import { GatewayError } from '@/server/gateway/errors';
import { getSession } from '@/server/session/get-session';

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function DelegatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  if (params.token) {
    await stashDelegateToken(params.token);
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
    if (err instanceof GatewayError) {
      if (err.code === 'DELEGATE_NOT_ALLOWED' || err.code === 'FORBIDDEN') {
        redirect('/forbidden');
      }
      if (err.status === 410 || err.code === 'DELEGATE_EXPIRED') {
        return (
          <ErrorScreen
            title="Запрос больше не действует"
            description="Ссылка истекла или уже использована. Попросите участника запросить вход снова."
            code="RECOVERY_GONE"
          />
        );
      }
    }
    throw err;
  }
}
