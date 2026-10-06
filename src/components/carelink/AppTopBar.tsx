import * as React from 'react';
import { logoutAction } from '@/server/actions/logout';
import { Button } from '@/components/ui/button';

export type AppTopBarProps = {
  roleLabel?: string;
};

export function AppTopBar({ roleLabel }: AppTopBarProps) {
  return (
    <header className="fixed left-[248px] right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
      <div
        className="flex w-72 items-center rounded-lg bg-muted/80 px-3 py-2 text-sm text-muted-foreground"
        aria-disabled
      >
        <span className="truncate">Поиск по семье (скоро)</span>
      </div>
      <div className="flex items-center gap-3">
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
