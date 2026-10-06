'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  id?: string;
};

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled,
  error,
  id = 'otp',
}: OtpInputProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const setAt = (index: number, char: string) => {
    const next = digits.map((d, i) => (i === index ? char : d === ' ' ? '' : d)).join('');
    onChange(next.replace(/\s/g, '').slice(0, length));
  };

  return (
    <div>
      <div className="flex gap-2" role="group" aria-labelledby={`${id}-label`}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={i === 0 ? id : undefined}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={disabled}
            value={d.trim()}
            aria-label={`Цифра ${i + 1} из ${length}`}
            className={cn(
              'h-12 w-11 rounded-[var(--radius-md)] border border-input bg-card text-center font-mono text-xl tabular-nums shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50',
              error && 'border-destructive',
            )}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(-1);
              setAt(i, v);
              if (v && i < length - 1) refs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digits[i]?.trim() && i > 0) {
                refs.current[i - 1]?.focus();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
              onChange(pasted);
              refs.current[Math.min(pasted.length, length - 1)]?.focus();
            }}
          />
        ))}
      </div>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
