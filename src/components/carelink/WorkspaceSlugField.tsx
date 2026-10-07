'use client';

import * as React from 'react';
import { WORKSPACE_LOGIN_DOMAIN } from '@/lib/workspace-slug';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type WorkspaceSlugFieldProps = {
  id: string;
  name: string;
  label: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  footer?: React.ReactNode;
};

export function WorkspaceSlugField({
  id,
  name,
  label,
  hint = 'Часть workspace-логина до @',
  error,
  placeholder = 'ivanovy',
  disabled,
  required,
  autoComplete = 'off',
  defaultValue,
  value,
  onChange,
  onBlur,
  footer,
}: WorkspaceSlugFieldProps) {
  const controlled = value !== undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex overflow-hidden rounded-lg border border-input bg-card shadow-card focus-within:ring-[3px] focus-within:ring-ring">
        <Input
          id={id}
          name={name}
          className="border-0 shadow-none focus-visible:ring-0"
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          defaultValue={controlled ? undefined : defaultValue}
          value={controlled ? value : undefined}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          onBlur={onBlur}
        />
        <span className="flex items-center border-l border-border bg-muted px-3 text-sm text-muted-foreground">
          @{WORKSPACE_LOGIN_DOMAIN}
        </span>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : footer ? (
        footer
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
