import { describe, expect, it, vi } from 'vitest';
import type { SessionRecord } from '@/server/session/types';

const taintUniqueValue = vi.fn();
const taintObjectReference = vi.fn();

vi.mock('react', () => ({
  experimental_taintUniqueValue: (...args: unknown[]) => taintUniqueValue(...args),
  experimental_taintObjectReference: (...args: unknown[]) => taintObjectReference(...args),
}));

import { taintSessionSecrets } from '@/server/session/taint';

function baseSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    userId: 'user-1',
    defaultFamilyId: 'fam-1',
    activeFamilyId: 'fam-1',
    userRefresh: 'ur',
    families: {
      'fam-1': { access: 'at', refresh: 'rt', expiresAt: new Date().toISOString() },
    },
    deviceSession: '',
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('taintSessionSecrets', () => {
  it('does not taint empty deviceSession', () => {
    taintUniqueValue.mockClear();
    taintObjectReference.mockClear();
    taintSessionSecrets(baseSession({ deviceSession: '' }));
    const deviceTaint = taintUniqueValue.mock.calls.some((c) =>
      String(c[0]).includes('deviceSession'),
    );
    expect(deviceTaint).toBe(false);
  });

  it('taints non-empty deviceSession', () => {
    taintUniqueValue.mockClear();
    taintSessionSecrets(baseSession({ deviceSession: 'ds-secret' }));
    const deviceTaint = taintUniqueValue.mock.calls.some((c) =>
      String(c[0]).includes('deviceSession'),
    );
    expect(deviceTaint).toBe(true);
  });
});
