import type { Metadata } from 'next';
import { OnboardingEmailForm } from '@/components/carelink/OnboardingEmailForm';

export const metadata: Metadata = {
  title: 'Онбординг — почта',
};

type PageProps = {
  searchParams: Promise<{ link?: string }>;
};

export default async function OnboardingEmailPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <OnboardingEmailForm linkInvalid={params.link === 'invalid'} />;
}
