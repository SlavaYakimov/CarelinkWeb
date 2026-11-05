/** Plaintext limit before client encryption — verify against CarelinkAuth PR #368 OpenAPI. */
export const STICKY_NOTE_MAX_PLAINTEXT_CHARS = 500;

/** Server-side daily send limit (product SPEC-26). */
export const STICKY_NOTE_DAILY_SEND_LIMIT = 10;

export const STICKY_NOTE_ENVELOPE_FORMAT = 'aes-256-gcm-hkdf-sha256-v1' as const;
