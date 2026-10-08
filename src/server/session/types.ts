import 'server-only';

export type FamilyTokens = {
  access: string;
  refresh: string;
  expiresAt: string;
};

export type SessionRecord = {
  userId: string;
  defaultFamilyId: string;
  activeFamilyId: string;
  userRefresh: string;
  families: Record<string, FamilyTokens>;
  deviceSession: string;
  createdAt: string;
  lastSeenAt: string;
  /** «Чужой компьютер»: короткий срок, session-cookie без Max-Age */
  guestMode?: boolean;
  csrfToken?: string;
};

export type FlowKind = 'signin' | 'onboarding' | 'join' | 'recovery' | 'invite' | 'delegate';

export type FlowRecord = {
  kind: FlowKind;
  step?: string;
  workspaceEmail?: string;
  verificationChannel?: 'push' | 'sms' | 'delegate';
  displayName?: string;
  phoneE164?: string;
  deviceSession?: string;
  /** From login checkbox — false = guest / «чужой компьютер» (Q6). */
  trustDevice?: boolean;
  smsSentAt?: string;
  /** Onboarding device step: SMS for trusting browser (separate from phone OTP). */
  deviceSmsSentAt?: string;
  delegatePushSentAt?: string;
  challengeId?: string;
  onboardingChallengeId?: string;
  userId?: string;
  userRefresh?: string;
  deviceRegistrationToken?: string;
  sessionId?: string;
  requestId?: string;
  approvalSecret?: string;
  inviteCode?: string;
  /** Recovery request: workspace slug (family address). */
  familySlug?: string;
  /** Onboarding: personal email (step 11). */
  personalEmail?: string;
  /** Onboarding: keeper display name (step 12). */
  keeperDisplayName?: string;
  /** Onboarding: phone already registered — second workspace for an existing user (step 12a). */
  existingUser?: boolean;
  /** Onboarding step 12a: families the existing user can sign in to (BE-27). */
  existingWorkspaces?: { workspaceSlug: string; displayName: string }[];
  /** Onboarding: draft slug before finalize (step 15). */
  workspaceSlug?: string;
  /** Onboarding: provisional workspace email after email verify. */
  provisionalWorkspaceEmail?: string;
  /** Onboarding done screen (step 16). */
  finalizedWorkspaceEmail?: string;
  finalizedWorkspaceSlug?: string;
  finalizedDisplayName?: string;
  phoneVerified?: boolean;
  /** Encrypted delegate-link token for keeper review (kind=delegate). */
  delegateTokenEnc?: string;
  createdAt: string;
};
