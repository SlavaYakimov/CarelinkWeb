import { describe, expect, it } from 'vitest';
import { formatFamilyPublicUrl, suggestFamilySlugFromName } from '@/lib/family-slug';

describe('family slug R7', () => {
  it('suggests transliterated slug from Russian name', () => {
    expect(suggestFamilySlugFromName('Семья Якимовых')).toBe('semia-iakimovyh');
  });

  it('formats public URL', () => {
    expect(formatFamilyPublicUrl('semia-iakimovyh')).toBe('carelink.app/semia-iakimovyh');
  });
});
