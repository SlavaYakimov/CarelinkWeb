'use client';

import * as React from 'react';
import { Heart } from 'lucide-react';
import { AppSidebarNav } from '@/components/carelink/AppSidebarNav';

export function AppSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[248px] flex-col justify-between border-r border-border bg-muted/50 p-4 lg:flex">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 px-1">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Heart className="size-4" aria-hidden />
          </div>
          <div>
            <p className="font-heading text-base font-semibold text-primary">Carelink</p>
            <p className="text-xs font-medium uppercase tracking-wider text-secondary">
              Тихая забота
            </p>
          </div>
        </div>
        <AppSidebarNav />
      </div>
    </aside>
  );
}
