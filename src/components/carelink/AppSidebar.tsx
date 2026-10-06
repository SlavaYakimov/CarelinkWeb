'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Heart, Home, LayoutGrid, Mail, Shield, Smartphone, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

const NAV: NavItem[] = [
  { href: '/families', label: 'Главная', icon: Home },
  { href: '/families/members', label: 'Семья', icon: Users, disabled: true },
  { href: '/invites', label: 'Приглашения', icon: Mail, disabled: true },
  { href: '/requests/join', label: 'Заявки', icon: LayoutGrid, disabled: true },
  { href: '/notifications', label: 'Уведомления', icon: Bell, disabled: true },
  { href: '/profile', label: 'Профиль', icon: User, disabled: true },
  { href: '/devices', label: 'Устройства и сессии', icon: Smartphone, disabled: true },
  { href: '/security', label: 'Безопасность', icon: Shield, disabled: true },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[248px] flex-col justify-between border-r border-border bg-muted/50 p-4">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 px-1">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Heart className="size-4" aria-hidden />
          </div>
          <div>
            <p className="font-heading text-base font-semibold text-primary">Carelink</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-secondary">
              Тихая забота
            </p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active =
              !item.disabled &&
              (pathname === item.href ||
                (item.href !== '/families' && pathname.startsWith(item.href)));
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <span
                  key={item.label}
                  className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground/70"
                  title="Скоро"
                >
                  <Icon className="size-5 shrink-0 opacity-60" aria-hidden />
                  {item.label}
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
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
      </div>
    </aside>
  );
}
