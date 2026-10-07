'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Copy } from 'lucide-react';
import { StepShell } from '@/components/carelink/StepShell';
import { Button } from '@/components/ui/button';

export type OnboardingDonePanelProps = {
  workspaceEmail: string;
  displayName: string;
};

export function OnboardingDonePanel({ workspaceEmail, displayName }: OnboardingDonePanelProps) {
  const [copied, setCopied] = React.useState(false);

  const copyLogin = async () => {
    try {
      await navigator.clipboard.writeText(workspaceEmail);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <StepShell
      step={5}
      totalSteps={5}
      title="Семья создана"
      description={`«${displayName}» готова. Сохраните workspace-логин — он понадобится при входе.`}
    >
      <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">Workspace-логин</p>
        <p className="font-mono text-lg">{workspaceEmail}</p>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => void copyLogin()}
        >
          {copied ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
          {copied ? 'Скопировано' : 'Скопировать логин'}
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1">
          <Link href="/families">На главную</Link>
        </Button>
        <Button asChild variant="secondary" className="flex-1">
          <Link href="/families">Пригласить участников позже</Link>
        </Button>
      </div>
    </StepShell>
  );
}
