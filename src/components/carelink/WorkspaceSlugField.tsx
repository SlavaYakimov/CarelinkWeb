'use client';

import * as React from 'react';
import { SlugInput } from '@/components/carelink/SlugInput';
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
  hint = 'Часть логина для входа до @',
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
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const slugValue = value !== undefined ? value : internal;
  const setSlugValue = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <SlugInput
        id={id}
        name={name}
        value={slugValue}
        onChange={setSlugValue}
        disabled={disabled}
        placeholder={placeholder}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
      />
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
