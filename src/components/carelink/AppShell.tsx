'use client';

import * as React from 'react';
import type { ReactNode } from 'react';
import { AppMobileNav } from '@/components/carelink/AppMobileNav';
import { AppSidebar } from '@/components/carelink/AppSidebar';
import { AppTopBar } from '@/components/carelink/AppTopBar';
import { useRouteMainFocus } from '@/components/carelink/use-route-main-focus';
import { cn } from '@/lib/utils';

export type AppShellProps = {
  children: ReactNode;
  roleLabel?: string;
};

export function AppShell({ children, roleLabel }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const mainRef = React.useRef<HTMLElement>(null);
  useRouteMainFocus(mainRef);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className={cn(
          'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]',
          'focus:rounded-[var(--radius-md)] focus:bg-card focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-primary',
          'focus:shadow-card focus:outline-none focus:ring-[3px] focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
        )}
      >
        К содержимому
      </a>
      <AppSidebar />
      <div id="app-mobile-nav">
        <AppMobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      </div>
      <AppTopBar
        roleLabel={roleLabel}
        mobileNavOpen={mobileNavOpen}
        onMobileNavOpenChange={setMobileNavOpen}
      />
      <main
        ref={mainRef}
        id="main"
        tabIndex={-1}
        className="min-h-screen pt-16 outline-none lg:ml-[248px]"
      >
        {children}
      </main>
    </div>
  );
}
