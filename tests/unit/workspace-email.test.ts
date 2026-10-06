import { describe, it, expect } from 'vitest';
import { isPlausibleWorkspaceEmail, normalizeWorkspaceEmail } from '@/lib/workspace-email';

describe('workspace email', () => {
  it('normalizes case and trim', () => {
    expect(normalizeWorkspaceEmail('  Ivan@Workspaces.Carelink.app ')).toBe(
      'ivan@workspaces.carelink.app',
    );
  });

  it('validates plausible addresses', () => {
    expect(isPlausibleWorkspaceEmail('ivanovy@workspaces.carelink.app')).toBe(true);
    expect(isPlausibleWorkspaceEmail('bad')).toBe(false);
  });
});
