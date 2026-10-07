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
    const { result } = renderHook(() =>
      useResendCountdown({ startOnMount: false, trigger: undefined }),
    );
    expect(result.current.secondsLeft).toBe(0);
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.secondsLeft).toBe(0);
  });

  it('counts down from mount and stops at zero', () => {
    const { result } = renderHook(() =>
      useResendCountdown({ startOnMount: true, trigger: undefined, seconds: 3 }),
    );
    expect(result.current.secondsLeft).toBe(3);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(2);
    expect(result.current.label).toBe('0:02');
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.secondsLeft).toBe(0);
  });

  it('starts when trigger becomes true', () => {
    const { result, rerender } = renderHook(
      ({ trigger }: { trigger: boolean | undefined }) =>
        useResendCountdown({ startOnMount: false, trigger, seconds: 60 }),
      { initialProps: { trigger: undefined as boolean | undefined } },
    );
    expect(result.current.secondsLeft).toBe(0);
    rerender({ trigger: true });
    expect(result.current.secondsLeft).toBe(60);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(59);
  });

  it('restart resets to full duration', () => {
    const { result } = renderHook(() =>
      useResendCountdown({ startOnMount: true, trigger: undefined, seconds: 10 }),
    );
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.secondsLeft).toBe(0);
    act(() => result.current.restart());
    expect(result.current.secondsLeft).toBe(10);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(9);
  });
});
