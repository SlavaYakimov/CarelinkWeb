// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { formatMmSs, useResendCountdown } from '@/components/carelink/use-resend-countdown';

describe('formatMmSs', () => {
  it('formats seconds as m:ss', () => {
    expect(formatMmSs(60)).toBe('1:00');
    expect(formatMmSs(59)).toBe('0:59');
    expect(formatMmSs(5)).toBe('0:05');
    expect(formatMmSs(0)).toBe('0:00');
  });
});

describe('useResendCountdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is idle when not started on mount', () => {
    const { result } = renderHook(() => useResendCountdown({ startOnMount: false }));
    expect(result.current.secondsLeft).toBe(0);
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.secondsLeft).toBe(0);
  });

  it('counts down from mount and stops at zero', () => {
    const { result } = renderHook(() => useResendCountdown({ startOnMount: true, seconds: 3 }));
    expect(result.current.secondsLeft).toBe(3);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(2);
    expect(result.current.label).toBe('0:02');
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.secondsLeft).toBe(0);
  });

  it('starts when successAt changes', () => {
    const { result, rerender } = renderHook(
      ({ successAt }: { successAt?: string }) =>
        useResendCountdown({ startOnMount: false, successAt, seconds: 60 }),
      { initialProps: { successAt: undefined as string | undefined } },
    );
    expect(result.current.secondsLeft).toBe(0);
    rerender({ successAt: '2024-01-01T00:00:00.000Z' });
    expect(result.current.secondsLeft).toBe(60);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(59);
  });

  it('applyRetryAfter sets cooldown from server', () => {
    const { result } = renderHook(() => useResendCountdown({ startOnMount: false, seconds: 60 }));
    act(() => result.current.applyRetryAfter(25));
    expect(result.current.secondsLeft).toBe(25);
  });
});
