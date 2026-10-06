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

export type FlowKind = 'signin' | 'onboarding' | 'join' | 'recovery' | 'invite';

export type FlowRecord = {
  kind: FlowKind;
  step?: string;
  challengeId?: string;
  onboardingChallengeId?: string;
  userId?: string;
  userRefresh?: string;
  deviceRegistrationToken?: string;
  sessionId?: string;
  requestId?: string;
  approvalSecret?: string;
  inviteCode?: string;
  /** Encrypted at rest (AES-GCM blob), max FLOW_TTL — Q5 */
  pendingPasswordEnc?: string;
  createdAt: string;
};
