import { redirect } from 'next/navigation';
import { PublicInviteLanding } from '@/components/carelink/PublicInviteLanding';
import { normalizeInviteCode } from '@/server/flows/invite-flow';

type PageProps = { searchParams: Promise<{ code?: string }> };

export default async function PublicInvitePage({ searchParams }: PageProps) {
  const { code: rawCode } = await searchParams;
  const code = normalizeInviteCode(rawCode ?? null);
  if (!code) {
    redirect('/invite/unavailable?reason=invalid_code');
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <PublicInviteLanding code={code} />
    </div>
  );
}
