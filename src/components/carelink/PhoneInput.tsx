'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRuPhoneDisplay, normalizeRuPhone } from '@/lib/phone';

export type PhoneInputProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (displayValue: string, e164: string | null) => void;
  error?: string;
  disabled?: boolean;
  hint?: string;
};

export function PhoneInput({
  id = 'phone',
  label = 'Телефон',
  value,
  onChange,
  error,
  disabled,
  hint,
}: PhoneInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+7 (900) 000-00-00"
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(e) => {
          const formatted = formatRuPhoneDisplay(e.target.value);
          onChange(formatted, normalizeRuPhone(formatted));
        }}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
