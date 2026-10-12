'use client';

import * as React from 'react';
import { filterOtp } from '@/lib/forms/filters';
import { cn } from '@/lib/utils';

export type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  /** When set, the real input participates in form submit (no hidden duplicate). */
  name?: string;
  disabled?: boolean;
  error?: string;
  attemptsHint?: string;
  id?: string;
  labelledBy?: string;
  labelText?: string;
  /** Called once when length digits entered (before auto-submit). */
  onFilled?: () => void;
  /** Parent form id for auto-submit on 6th digit */
  formId?: string;
};

export function OtpInput({
  length = 6,
  value,
  onChange,
  name,
  disabled,
  error,
  attemptsHint,
  id = 'otp',
  labelledBy,
  labelText = 'Код подтверждения',
  onFilled,
  formId,
}: OtpInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const submittedForRef = React.useRef<string | null>(null);
  const groupLabelId = labelledBy ?? `${id}-label`;
  const showBuiltinLabel = !labelledBy;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, attemptsHint ? hintId : null]
    .filter(Boolean)
    .join(' ');

  const digits = value.padEnd(length, ' ').slice(0, length).split('');
  const activeIndex = Math.min(value.length, length - 1);

  React.useEffect(() => {
    if (!error) return;
    onChange('');
    submittedForRef.current = null;
    inputRef.current?.focus();
  }, [error, onChange]);

  React.useEffect(() => {
    if (value.length < length) {
      submittedForRef.current = null;
    }
    if (value.length !== length || disabled) return;
    if (submittedForRef.current === value) return;
    submittedForRef.current = value;
    onFilled?.();
    if (formId) {
      const form = document.getElementById(formId);
      if (form instanceof HTMLFormElement && !disabled) {
        form.requestSubmit();
      }
    }
  }, [value, length, disabled, formId, onFilled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = filterOtp(e.target.value);
    onChange(next);
  };

  const focusInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    const len = value.length;
    el.setSelectionRange(len, len);
  };

  const shake =
    Boolean(error) &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div>
      {showBuiltinLabel ? (
        <span id={groupLabelId} className="sr-only">
          {labelText} — {length} цифр
        </span>
      ) : null}
      <div
        className={cn('relative', shake && 'animate-[otp-shake_0.3s_ease-in-out]')}
        role="group"
        aria-labelledby={groupLabelId}
      >
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern={`\\d{${length}}`}
          maxLength={length}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          data-otp-input
          className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
          onFocus={focusInput}
        />
        <div className="flex gap-2" aria-hidden onClick={focusInput}>
          {digits.map((d, i) => (
            <div
              key={i}
              className={cn(
                'flex h-12 w-11 items-center justify-center rounded-[var(--radius-md)] border border-input bg-card font-mono text-xl tabular-nums shadow-[var(--shadow-card)]',
                i === activeIndex && value.length < length && 'ring-[3px] ring-ring',
                error && 'border-destructive',
                disabled && 'opacity-50',
              )}
            >
              {d.trim()}
            </div>
          ))}
        </div>
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      {attemptsHint ? (
        <p id={hintId} className="mt-2 text-xs text-muted-foreground">
          {attemptsHint}
        </p>
      ) : null}
    </div>
  );
}
