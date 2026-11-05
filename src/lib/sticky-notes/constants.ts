/** Client-only UI limit (backend has no plaintext cap). */
export const STICKY_NOTE_UI_MAX_PLAINTEXT_CHARS = 500;

/** Server-side daily send limit (product SPEC-26). */
export const STICKY_NOTE_DAILY_SEND_LIMIT = 10;

/** HKDF info — aligned with RN; BE does not validate (TODO SN-OQ-1: final kid/info protocol). */
export const STICKY_NOTE_HKDF_INFO = 'carelink.family.sticky-note.v1';

/** HKDF salt — empty, aligned with RN. */
export const STICKY_NOTE_HKDF_SALT_BYTES = new Uint8Array(0);

/** Placeholder until SN-OQ-1 key distribution. */
export const STICKY_NOTE_STUB_KID = 'carelink:family-content-key:stub';

export const STICKY_NOTE_MAX_TEXT_CIPHERTEXT_BYTES = 8 * 1024;
export const STICKY_NOTE_MAX_DOODLE_CIPHERTEXT_BYTES = 32 * 1024;
export const STICKY_NOTE_MAX_REQUEST_BODY_BYTES = 64 * 1024;
