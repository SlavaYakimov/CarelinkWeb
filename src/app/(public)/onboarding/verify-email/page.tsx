import { verifyOnboardingEmailLinkAction } from '@/server/actions/onboarding';

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function OnboardingVerifyEmailPage({ searchParams }: PageProps) {
  const params = await searchParams;
  await verifyOnboardingEmailLinkAction(params.token ?? '');
}
