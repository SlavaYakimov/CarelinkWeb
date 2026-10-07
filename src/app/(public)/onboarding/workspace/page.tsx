import { OnboardingWorkspaceForm } from '@/components/carelink/OnboardingWorkspaceForm';
import { requireOnboardingFlow } from '@/server/flows/onboarding-flow';

export default async function OnboardingWorkspacePage() {
  const { flow } = await requireOnboardingFlow('workspace');
  return (
    <OnboardingWorkspaceForm
      defaultSlug={flow.workspaceSlug ?? ''}
      defaultDisplayName={flow.keeperDisplayName ?? flow.finalizedDisplayName ?? ''}
    />
  );
}
