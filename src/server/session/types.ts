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
  /** Encrypted delegate-link token for keeper review (kind=delegate). */
  delegateTokenEnc?: string;
  createdAt: string;
};
