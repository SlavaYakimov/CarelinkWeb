import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const slug = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9-]+$/);

describe('recovery slug validation', () => {
  it('accepts latin slug', () => {
    expect(slug.safeParse('ivanovy').success).toBe(true);
    expect(slug.safeParse('Иванов').success).toBe(false);
  });
});
