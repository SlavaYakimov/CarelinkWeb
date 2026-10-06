'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { isPasswordStrongEnough, PASSWORD_RULES } from '@/lib/password-rules';

export type PasswordFieldProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: 'new-password' | 'current-password';
  error?: string;
  disabled?: boolean;
  showRequirements?: boolean;
};

export function PasswordField({
  id = 'password',
  label = 'Пароль',
  value,
  onChange,
  autoComplete = 'new-password',
  error,
  disabled,
  showRequirements = true,
}: PasswordFieldProps) {
  const [visible, setVisible] = React.useState(false);
  const strong = isPasswordStrongEnough(value);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="pr-11"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {showRequirements ? (
        <ul className="space-y-1 text-sm" aria-live="polite">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(value);
            return (
              <li
                key={rule.id}
                className={cn(
                  'flex items-center gap-2',
                  ok ? 'text-success' : 'text-muted-foreground',
                )}
              >
                <span aria-hidden>{ok ? '✓' : '○'}</span>
                {rule.label}
              </li>
            );
          })}
        </ul>
      ) : null}
      {!error && value && !strong ? (
        <p className="text-sm text-muted-foreground">
          Пароль пока не соответствует всем требованиям
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
