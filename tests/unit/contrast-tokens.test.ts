import { describe, it, expect } from 'vitest';
import { blendOver, contrastRatio } from '@/lib/a11y/contrast';

/**
 * Hex values mirror `src/styles/globals.css` @theme — keep in sync when tokens change.
 */
const TOKENS = {
  background: '#f7faf8',
  foreground: '#14201b',
  card: '#ffffff',
  primary: '#1f5c4a',
  secondary: '#8a6a3b',
  mutedForeground: '#4a5650',
  warning: '#a86200',
  warningMuted: '#fff4e0',
  warningForeground: '#14201b',
  input: '#8a958f',
  ring: '#1f5c4a',
} as const;

describe('Carelink theme token contrast (WCAG)', () => {
  it('focus ring meets 3:1 non-text contrast on card', () => {
    expect(contrastRatio(TOKENS.ring, TOKENS.card)).toBeGreaterThanOrEqual(3);
  });

  it('input border meets 3:1 on card', () => {
    expect(contrastRatio(TOKENS.input, TOKENS.card)).toBeGreaterThanOrEqual(3);
  });

  it('role badge text meets 4.5:1 on blended secondary tint', () => {
    const badgeBg = blendOver(TOKENS.secondary, 0.1, TOKENS.card);
    expect(contrastRatio(TOKENS.foreground, badgeBg)).toBeGreaterThanOrEqual(4.5);
  });

  it('warning copy on warning-muted meets 4.5:1', () => {
    const warningText = '#8a5000';
    expect(contrastRatio(warningText, TOKENS.warningMuted)).toBeGreaterThanOrEqual(4.5);
  });

  it('disabled nav label meets 4.5:1 on sidebar muted surface', () => {
    const sidebarBg = blendOver('#eef3f0', 0.5, TOKENS.background);
    expect(contrastRatio(TOKENS.mutedForeground, sidebarBg)).toBeGreaterThanOrEqual(4.5);
  });
});
