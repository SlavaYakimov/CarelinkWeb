'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { logoutAction } from '@/server/actions/logout';
import { Button } from '@/components/ui/button';

export type AppTopBarProps = {
  roleLabel?: string;
  mobileNavOpen?: boolean;
  onMobileNavOpenChange?: (open: boolean) => void;
};

export function AppTopBar({
  roleLabel,
  mobileNavOpen = false,
  onMobileNavOpenChange,
}: AppTopBarProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-4 shadow-sm lg:left-[248px] lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-4">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="shrink-0 lg:hidden"
          aria-label="Открыть меню"
          aria-expanded={mobileNavOpen}
          aria-controls="app-mobile-nav"
          onClick={() => onMobileNavOpenChange?.(true)}
        >
          <Menu className="size-5" aria-hidden />
        </Button>
        <div
          className="hidden w-72 max-w-full items-center rounded-lg bg-muted/80 px-3 py-2 text-sm text-muted-foreground lg:flex"
          aria-disabled
        >
          <span className="truncate">Поиск по семье (скоро)</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {roleLabel ? (
          <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-medium text-secondary">
            {roleLabel}
          </span>
        ) : null}
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" size="sm">
            Выйти
          </Button>
        </form>
      </div>
    </header>
  );
}
