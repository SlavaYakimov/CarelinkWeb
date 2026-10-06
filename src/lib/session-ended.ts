/** Shared code for browser fetch and BFF JSON when refresh/session is revoked. */
export const SESSION_ENDED_CODE = 'SESSION_ENDED' as const;

export type SessionEndedJson = { code: typeof SESSION_ENDED_CODE };
