'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_NAV_ITEMS } from '@/components/carelink/app-nav-config';
import { cn } from '@/lib/utils';

export type AppSidebarNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function AppSidebarNav({ onNavigate, className }: AppSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn('flex flex-col gap-1', className)} aria-label="Основное меню">
      {APP_NAV_ITEMS.map((item) => {
        const active =
          !item.disabled &&
          (pathname === item.href || (item.href !== '/families' && pathname.startsWith(item.href)));
        const Icon = item.icon;
        if (item.disabled) {
          return (
            <span
              key={item.label}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground"
            >
              <Icon className="size-5 shrink-0 opacity-60" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Скоро
              </span>
              <span className="sr-only"> — раздел скоро будет доступен</span>
            </span>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              active
                ? 'bg-accent font-semibold text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
