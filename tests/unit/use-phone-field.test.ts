// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePhoneField } from '@/components/carelink/use-phone-field';

describe('usePhoneField', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => usePhoneField());
    expect(result.current).toMatchObject({ display: '', e164: '', submitValue: '' });
  });

  it('prefers E.164 for submit when the number is complete', () => {
    const { result } = renderHook(() => usePhoneField());
    act(() => result.current.onChange('+7 (900) 123-45-67', '+79001234567'));
    expect(result.current.display).toBe('+7 (900) 123-45-67');
    expect(result.current.e164).toBe('+79001234567');
    expect(result.current.submitValue).toBe('+79001234567');
  });

  it('falls back to display while the number is incomplete', () => {
    const { result } = renderHook(() => usePhoneField());
    act(() => result.current.onChange('+7 (900) 12', null));
    expect(result.current.e164).toBe('');
    expect(result.current.submitValue).toBe('+7 (900) 12');
  });

  it('keeps onChange stable across renders', () => {
    const { result, rerender } = renderHook(() => usePhoneField());
    const first = result.current.onChange;
    rerender();
    expect(result.current.onChange).toBe(first);
  });
});
