import { OnboardingDeviceForm } from '@/components/carelink/OnboardingDeviceForm';
import { requireOnboardingFlow } from '@/server/flows/onboarding-flow';

export default async function OnboardingDevicePage() {
  const { flow } = await requireOnboardingFlow('device');
  const smsAlreadySent = Boolean(flow.deviceSmsSentAt);

  return <OnboardingDeviceForm smsAlreadySent={smsAlreadySent} />;
}
