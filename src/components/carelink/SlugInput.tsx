'use client';

import * as React from 'react';
import { filterSlug } from '@/lib/forms/filters';
import { coerceWorkspaceSlugFieldInput, WORKSPACE_LOGIN_DOMAIN } from '@/lib/workspace-slug';
import { Input } from '@/components/ui/input';

export type SlugInputProps = {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onCyrillicRejected?: () => void;
  disabled?: boolean;
  placeholder?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  onBlur?: () => void;
};

export function SlugInput({
  id,
  name,
  value,
  onChange,
  onCyrillicRejected,
  disabled,
  placeholder = 'ivanovy',
  onBlur,
  ...aria
}: SlugInputProps) {
  const [latinHint, setLatinHint] = React.useState(false);

  React.useEffect(() => {
    if (!latinHint) return;
    const t = window.setTimeout(() => setLatinHint(false), 2000);
    return () => window.clearTimeout(t);
  }, [latinHint]);

  return (
    <div className="flex overflow-hidden rounded-lg border border-input bg-card shadow-card focus-within:ring-[3px] focus-within:ring-ring">
      <Input
        id={id}
        name={name}
        className="border-0 shadow-none focus-visible:ring-0"
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        inputMode="url"
        maxLength={32}
        value={value}
        onBlur={(e) => {
          const normalized = filterSlug(e.target.value.trim(), value)
            .value.replace(/^-+/, '')
            .replace(/-+$/, '');
          if (normalized !== value) {
            onChange(normalized);
          }
          onBlur?.();
        }}
        onChange={(e) => {
          let raw = e.target.value;
          if (/workspaces|carelink|@|\.app|app$/i.test(raw)) {
            raw = coerceWorkspaceSlugFieldInput(raw);
          }
          const { value: next, rejectedCyrillic } = filterSlug(raw, value);
          if (rejectedCyrillic) {
            setLatinHint(true);
            onCyrillicRejected?.();
          }
          onChange(next);
        }}
        {...aria}
      />
      <span className="flex items-center border-l border-border bg-muted px-3 text-sm text-muted-foreground">
        @{WORKSPACE_LOGIN_DOMAIN}
      </span>
      {latinHint ? (
        <span className="sr-only" role="status">
          Только латиница
        </span>
      ) : null}
    </div>
  );
}
