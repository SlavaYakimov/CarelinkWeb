import { describe, expect, it } from 'vitest';
import {
  coerceWorkspaceSlugFieldInput,
  formatWorkspaceLogin,
  parseWorkspaceSlugFromLogin,
} from '@/lib/workspace-slug';

describe('parseWorkspaceSlugFromLogin', () => {
  it('extracts local part from workspace email', () => {
    expect(parseWorkspaceSlugFromLogin('ivanovy@workspaces.carelink.app')).toBe('ivanovy');
  });

  it('normalizes bare slug', () => {
    expect(parseWorkspaceSlugFromLogin('  Ivanovy  ')).toBe('ivanovy');
  });

  it('returns slug when domain is not workspace', () => {
    expect(parseWorkspaceSlugFromLogin('user@example.com')).toBe('user@example.com');
  });
});

describe('coerceWorkspaceSlugFieldInput', () => {
  it('strips workspace email suffix while typing', () => {
    expect(coerceWorkspaceSlugFieldInput('yakimovs@workspaces.carelink.app')).toBe('yakimovs');
    expect(coerceWorkspaceSlugFieldInput('yakimovsworkspacescarelinkapp')).toBe('yakimovs');
    expect(coerceWorkspaceSlugFieldInput('yakimovsapp')).toBe('yakimovs');
  });
});

describe('formatWorkspaceLogin', () => {
  it('builds full login', () => {
    expect(formatWorkspaceLogin('ivanovy')).toBe('ivanovy@workspaces.carelink.app');
  });
});
