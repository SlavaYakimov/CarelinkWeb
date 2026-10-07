import { OnboardingPhoneForm } from '@/components/carelink/OnboardingPhoneForm';
import { maskRuPhoneE164 } from '@/lib/phone';
import { requireOnboardingFlow } from '@/server/flows/onboarding-flow';

export default async function OnboardingPhonePage() {
  const { flow } = await requireOnboardingFlow('phone');
  const initialPhoneMasked = flow.phoneE164 ? maskRuPhoneE164(flow.phoneE164) : undefined;
  const smsAlreadySent = Boolean(flow.smsSentAt && flow.phoneE164);

  return (
    <OnboardingPhoneForm
      initialPhoneMasked={initialPhoneMasked}
      smsAlreadySent={smsAlreadySent}
      defaultDisplayName={flow.keeperDisplayName ?? ''}
    />
  );
}
