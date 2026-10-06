import { redirect } from 'next/navigation';
import { OnboardingDonePanel } from '@/components/carelink/OnboardingDonePanel';
import { requireOnboardingFlow } from '@/server/flows/onboarding-flow';

export default async function OnboardingDonePage() {
  const { flow } = await requireOnboardingFlow('done');
  const workspaceEmail = flow.finalizedWorkspaceEmail ?? flow.provisionalWorkspaceEmail;
  const displayName = flow.finalizedDisplayName ?? flow.keeperDisplayName ?? 'Семья';

  if (!workspaceEmail) {
    redirect('/onboarding/workspace');
  }

  return <OnboardingDonePanel workspaceEmail={workspaceEmail} displayName={displayName} />;
}
