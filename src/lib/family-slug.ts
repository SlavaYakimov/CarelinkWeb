import { isValidWorkspaceSlug, normalizeWorkspaceSlug } from '@/lib/workspace-slug';

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'iu',
  я: 'ia',
};

/** Transliterate Russian family name to URL slug (R7). */
export function suggestFamilySlugFromName(name: string): string {
  const lower = name.trim().toLowerCase();
  let out = '';
  for (const ch of lower) {
    if (CYRILLIC_TO_LATIN[ch]) {
      out += CYRILLIC_TO_LATIN[ch];
    } else if (/[a-z0-9]/.test(ch)) {
      out += ch;
    } else if (/\s|[-_./,]/.test(ch)) {
      out += '-';
    }
  }
  out = out.replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
  if (out.length < 3) {
    out = `family-${Date.now().toString(36).slice(-6)}`;
  }
  return out;
}

export function normalizeFamilySlug(raw: string): string {
  return normalizeWorkspaceSlug(raw);
}

export function isValidFamilySlug(slug: string): boolean {
  return isValidWorkspaceSlug(slug);
}

export function formatFamilyPublicUrl(slug: string): string {
  return `carelink.app/${normalizeFamilySlug(slug)}`;
}
