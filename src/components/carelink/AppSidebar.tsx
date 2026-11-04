'use client';

import * as React from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
import { AppSidebarNav } from '@/components/carelink/AppSidebarNav';

export function AppSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[248px] flex-col justify-between border-r border-border bg-muted/50 p-4 lg:flex">
      <div className="flex flex-col gap-6">
        <BrandMark compact className="px-1" />
        <AppSidebarNav />
      </div>
    </aside>
  );
}
