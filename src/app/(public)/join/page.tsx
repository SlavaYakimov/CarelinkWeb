import { redirect } from 'next/navigation';
import { JoinQrForm } from '@/components/carelink/join/JoinQrForm';
import { readJoinFlow } from '@/server/flows/join-flow';
import { resolveJoinQrLanding } from '@/server/actions/join';

type PageProps = { searchParams: Promise<{ t?: string }> };

export default async function JoinQrPage({ searchParams }: PageProps) {
  const { t } = await searchParams;
  const ctx = await readJoinFlow();
  if (t && (!ctx?.flow.joinToken || ctx.flow.joinToken !== t)) {
    await resolveJoinQrLanding(t);
  }
  const refreshed = await readJoinFlow();
  const flow = refreshed?.flow;
  if (!flow?.joinToken || !flow.joinFamilyName || !flow.joinKeeperDisplayName) {
    redirect('/join/unavailable?reason=invalid_token');
  }
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <JoinQrForm
        joinToken={flow.joinToken}
        familyName={flow.joinFamilyName}
        keeperDisplayName={flow.joinKeeperDisplayName}
        roleLabel={flow.joinRoleLabel ?? 'Участник'}
        expiresAt={flow.joinExpiresAt}
      />
    </div>
  );
}
