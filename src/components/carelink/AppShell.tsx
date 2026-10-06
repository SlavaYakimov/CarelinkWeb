import * as React from 'react';
import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/carelink/AppSidebar';
import { AppTopBar } from '@/components/carelink/AppTopBar';

export type AppShellProps = {
  children: ReactNode;
  roleLabel?: string;
};

export function AppShell({ children, roleLabel }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <AppTopBar roleLabel={roleLabel} />
      <main className="ml-[248px] min-h-screen pt-16">{children}</main>
    </div>
  );
}
