import { OnboardingPasswordForm } from '@/components/carelink/OnboardingPasswordForm';
import { requireOnboardingFlow } from '@/server/flows/onboarding-flow';

export default async function OnboardingPasswordPage() {
  await requireOnboardingFlow('password');
  return <OnboardingPasswordForm />;
}
