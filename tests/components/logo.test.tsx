// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from '@/components/brand/Logo';
import { BrandMark } from '@/components/brand/BrandMark';

describe('Logo', () => {
  it('exposes accessible name Carelink', () => {
    render(<Logo data-testid="logo" />);
    expect(screen.getByRole('img', { name: 'Carelink' })).toBeTruthy();
  });

  it('BrandMark renders owl without house glyph', () => {
    render(<BrandMark />);
    expect(document.body.textContent).not.toContain('⌂');
    expect(screen.getByText('Спокойная забота')).toBeTruthy();
  });
});
