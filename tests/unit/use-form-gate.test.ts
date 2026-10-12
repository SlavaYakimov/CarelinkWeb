// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormGate } from '@/lib/forms/use-form-gate';
import { signInFormSchema } from '@/lib/forms/schemas';

describe('useFormGate', () => {
  it('blocks login submit when password too short', () => {
    const { result } = renderHook(() =>
      useFormGate(
        signInFormSchema,
        { workspaceSlug: 'valid-slug', password: 'short' },
        ['workspaceSlug', 'password'],
      ),
    );
    expect(result.current.canSubmit).toBe(false);
  });

  it('allows login when schema valid and not pending', () => {
    const { result } = renderHook(() =>
      useFormGate(
        signInFormSchema,
        { workspaceSlug: 'valid-slug', password: 'longenough' },
        ['workspaceSlug', 'password'],
        { pending: false },
      ),
    );
    expect(result.current.canSubmit).toBe(true);
  });

  it('hides client errors until touched', () => {
    const schema = z.object({ x: z.string().min(3) });
    const { result } = renderHook(() => useFormGate(schema, { x: 'a' }, ['x']));
    expect(result.current.showError('x')).toBe(false);
    act(() => result.current.touch('x'));
    expect(result.current.showError('x')).toBe(true);
  });
});
