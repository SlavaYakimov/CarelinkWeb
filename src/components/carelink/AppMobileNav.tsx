'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { AppSidebarNav } from '@/components/carelink/AppSidebarNav';
import { cn } from '@/lib/utils';

export type AppMobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AppMobileNav({ open, onOpenChange }: AppMobileNavProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 motion-safe:animate-[overlay-fade-in_var(--duration-ui-fast)_ease-out] lg:hidden" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex h-full w-[min(100%,280px)] flex-col border-r border-border bg-muted/50 p-4 shadow-lg outline-none lg:hidden',
            '-translate-x-full transition-transform duration-[var(--duration-ui-drawer)] ease-[var(--ease-ui-out)] motion-reduce:transition-none data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full',
          )}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-2 px-1">
            <DialogPrimitive.Title className="font-heading text-base font-semibold text-primary">
              Меню
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              aria-label="Закрыть меню"
            >
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          <AppSidebarNav
            onNavigate={() => onOpenChange(false)}
            className="flex-1 overflow-y-auto"
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
