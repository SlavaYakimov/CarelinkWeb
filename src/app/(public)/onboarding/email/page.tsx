import { OnboardingEmailForm } from '@/components/carelink/OnboardingEmailForm';

type PageProps = {
  searchParams: Promise<{ link?: string }>;
};

export default async function OnboardingEmailPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <OnboardingEmailForm linkInvalid={params.link === 'invalid'} />;
}
