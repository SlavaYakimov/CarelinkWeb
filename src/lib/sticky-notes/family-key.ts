/**
 * Family content key for sticky-note E2EE.
 *
 * OPEN SN-OQ-1: key distribution / rotation protocol is not defined in web yet.
 */

export type FamilyContentKeyProvider = {
  getRawKeyMaterial(familyId: string): Promise<Uint8Array | null>;
};

/** Production stub until SN-OQ-1 is resolved. */
export const stubFamilyContentKeyProvider: FamilyContentKeyProvider = {
  async getRawKeyMaterial() {
    return null;
  },
};

/** Test-only: 32-byte key from base64 env or fixed bytes. */
export function testFamilyContentKeyProvider(keyBase64?: string): FamilyContentKeyProvider {
  return {
    async getRawKeyMaterial() {
      const raw = keyBase64 ?? process.env.STICKY_NOTE_TEST_KEY_BASE64;
      if (!raw) return null;
      const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      if (bytes.length !== 32) return null;
      return bytes;
    },
  };
}

let activeProvider: FamilyContentKeyProvider = stubFamilyContentKeyProvider;

export function setFamilyContentKeyProvider(provider: FamilyContentKeyProvider): void {
  activeProvider = provider;
}

export function getFamilyContentKeyProvider(): FamilyContentKeyProvider {
  return activeProvider;
}
