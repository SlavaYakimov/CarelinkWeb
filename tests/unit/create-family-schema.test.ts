import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(2, 'Укажите имя семьи').max(120, 'Слишком длинное имя'),
});

describe('create family form schema', () => {
  it('requires at least 2 characters', () => {
    expect(schema.safeParse({ name: 'A' }).success).toBe(false);
    expect(schema.safeParse({ name: 'Сидоровы' }).success).toBe(true);
  });
});
