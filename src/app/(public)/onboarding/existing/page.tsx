import { redirect } from 'next/navigation';
import { OnboardingExistingPhonePanel } from '@/components/carelink/OnboardingExistingPhonePanel';
import { maskRuPhoneE164 } from '@/lib/phone';
import { requireOnboardingFlow } from '@/server/flows/onboarding-flow';

export default async function OnboardingExistingPhonePage() {
  const { flow } = await requireOnboardingFlow('device');
  if (!flow.existingUser) {
    redirect('/onboarding/device');
  }

  const phoneMasked = flow.phoneE164 ? maskRuPhoneE164(flow.phoneE164) : undefined;
  return (
    <OnboardingExistingPhonePanel phoneMasked={phoneMasked} workspaces={flow.existingWorkspaces} />
  );
}
