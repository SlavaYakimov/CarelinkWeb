// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from '@/components/carelink/AppShell';

const pathnameRef = { current: '/families' };

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameRef.current,
}));

vi.mock('@/server/actions/logout', () => ({
  logoutAction: vi.fn(),
}));

describe('AppShell responsive shell', () => {
  beforeEach(() => {
    pathnameRef.current = '/families';
  });

  it('exposes skip link to main landmark', () => {
    render(
      <AppShell>
        <h1>Мои семьи</h1>
      </AppShell>,
    );
    const skip = screen.getByRole('link', { name: 'К содержимому' });
    expect(skip.getAttribute('href')).toBe('#main');
    expect(document.getElementById('main')).toBeTruthy();
  });

  it('opens mobile nav drawer from burger with aria-expanded', async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <h1>Мои семьи</h1>
      </AppShell>,
    );
    const burger = screen.getByRole('button', { name: 'Открыть меню' });
    expect(burger.getAttribute('aria-expanded')).toBe('false');
    await user.click(burger);
    expect(burger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('dialog', { name: 'Меню' })).toBeTruthy();
    expect(screen.getAllByText('Главная').length).toBeGreaterThanOrEqual(1);
  });

  it('focuses h1 after route pathname change', () => {
    const { rerender } = render(
      <AppShell>
        <h1>Мои семьи</h1>
      </AppShell>,
    );
    const h1 = screen.getByRole('heading', { level: 1, name: 'Мои семьи' });
    expect(document.activeElement).toBe(h1);

    pathnameRef.current = '/families/new';
    rerender(
      <AppShell>
        <h1>Новая семья</h1>
      </AppShell>,
    );
    const h1New = screen.getByRole('heading', { level: 1, name: 'Новая семья' });
    expect(document.activeElement).toBe(h1New);
  });
});
