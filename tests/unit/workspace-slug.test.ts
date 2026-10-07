import { describe, it, expect } from 'vitest';
import {
  formatWorkspaceLogin,
  isValidWorkspaceSlug,
  normalizeEmailOtp,
  normalizeWorkspaceSlug,
} from '@/lib/workspace-slug';

describe('workspace slug helpers', () => {
  it('normalizes slug', () => {
    expect(normalizeWorkspaceSlug('  Ivanovy  ')).toBe('ivanovy');
  });

  it('validates slug pattern', () => {
    expect(isValidWorkspaceSlug('ab')).toBe(false);
    expect(isValidWorkspaceSlug('ivanovy')).toBe(true);
    expect(isValidWorkspaceSlug('ivanovy-family')).toBe(true);
    expect(isValidWorkspaceSlug('-bad')).toBe(false);
  });

  it('formats workspace login', () => {
    expect(formatWorkspaceLogin('ivanovy')).toBe('ivanovy@workspaces.carelink.app');
  });

  it('normalizes email otp', () => {
    expect(normalizeEmailOtp('123-456')).toBe('123456');
  });
});
