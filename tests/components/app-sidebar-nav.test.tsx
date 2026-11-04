// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppSidebarNav } from '@/components/carelink/AppSidebarNav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/families',
}));

describe('AppSidebarNav', () => {
  it('shows visible Скоро badge on disabled items', () => {
    render(<AppSidebarNav />);
    const badges = screen.getAllByText('Скоро');
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0]?.className).toMatch(/bg-muted/);
  });
});
