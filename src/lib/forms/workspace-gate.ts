import { onboardingWorkspaceFormSchema } from '@/lib/forms/schemas';
import { isValidWorkspaceSlug } from '@/lib/workspace-slug';

export type WorkspaceSlugCheckResult = {
  status: string;
  workspaceSlug?: string;
  message?: string;
};

export type WorkspaceSlugCheckUi =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'done'; result: WorkspaceSlugCheckResult };

export function isSlugAvailabilityOk(check: WorkspaceSlugCheckUi): boolean {
  return check.phase === 'done' && check.result.status === 'available';
}

/** Client submit rule for onboarding workspace (schema + slug availability). */
export function canSubmitOnboardingWorkspace(
  workspaceSlug: string,
  displayName: string,
  check: WorkspaceSlugCheckUi,
  pending: boolean,
): boolean {
  if (pending) return false;
  if (check.phase === 'checking') return false;
  if (!isSlugAvailabilityOk(check)) return false;
  return onboardingWorkspaceFormSchema.safeParse({ workspaceSlug, displayName }).success;
}

export function shouldApplyServerSlugToInput(_serverSlug: string, currentInput: string): boolean {
  void _serverSlug;
  void currentInput;
  return false;
}

export function isValidWorkspaceSlugForGate(slug: string): boolean {
  return isValidWorkspaceSlug(slug);
}
