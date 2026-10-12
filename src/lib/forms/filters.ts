/** Per-character filters and normalizers for form fields (pure, unit-testable). */

const SLUG_MAX = 32;
const CYRILLIC = /[\u0400-\u04FF]/;

export type FilterSlugResult = {
  value: string;
  rejectedCyrillic: boolean;
};

/** Filters slug input: latin digits hyphen, lower, space/_ → hyphen, collapse `--`, max 32. */
export function filterSlug(raw: string, prev = ''): FilterSlugResult {
  if (/^\s/.test(raw) && /\s$/.test(raw)) {
    raw = raw.trim();
  } else if (/^\s/.test(raw)) {
    raw = raw.trimStart();
  }
  let rejectedCyrillic = false;
  let out = '';
  for (const ch of raw) {
    if (CYRILLIC.test(ch)) {
      rejectedCyrillic = true;
      continue;
    }
    if (/[a-zA-Z0-9-]/.test(ch)) {
      out += ch.toLowerCase();
    } else if (ch === ' ' || ch === '_') {
      out += '-';
    }
  }
  out = out.replace(/-+/g, '-').replace(/^-+/, '').slice(0, SLUG_MAX);
  if (out.length === 0 && raw.length > 0 && !rejectedCyrillic) {
    return { value: prev, rejectedCyrillic: false };
  }
  return { value: out, rejectedCyrillic };
}

export function filterDigits(raw: string, maxLen: number): string {
  return raw.replace(/\D/g, '').slice(0, maxLen);
}

export function filterOtp(raw: string): string {
  return filterDigits(raw, 6);
}

export function filterEmail(raw: string): string {
  return raw.replace(/\s/g, '').slice(0, 254);
}

export function filterRequestId(raw: string): string {
  return raw.replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);
}

export type PhoneEditResult = {
  display: string;
  digitCount: number;
  selectionStart: number;
  selectionEnd: number;
};

function ruDigitsFromDisplay(display: string): string {
  let digits = display.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith('7')) digits = `7${digits}`;
  return digits.slice(0, 11);
}

function formatRuFromDigits(d: string): string {
  const p1 = d.slice(1, 4);
  const p2 = d.slice(4, 7);
  const p3 = d.slice(7, 9);
  const p4 = d.slice(9, 11);
  if (p1.length === 0) return '+7';
  let out = `+7 (${p1}`;
  if (p1.length < 3) return out;
  out += `) ${p2}`;
  if (p2.length < 3) return out;
  out += `-${p3}`;
  if (p3.length < 2) return out;
  out += `-${p4}`;
  return out;
}

/** Count digits before cursor position in display string. */
function digitIndexBefore(display: string, cursor: number): number {
  let count = 0;
  for (let i = 0; i < cursor && i < display.length; i += 1) {
    if (/\d/.test(display[i]!)) count += 1;
  }
  return count;
}

/** Map digit index to cursor position after formatting. */
function cursorAfterDigitIndex(formatted: string, digitIndex: number): number {
  if (digitIndex <= 0) {
    const plus = formatted.indexOf('7');
    return plus >= 0 ? plus + 1 : formatted.length;
  }
  let seen = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i]!)) {
      seen += 1;
      if (seen === digitIndex) return i + 1;
    }
  }
  return formatted.length;
}

/**
 * Applies phone mask while preserving caret by digit index.
 * Handles backspace over formatting separators.
 */
export function formatPhoneKeepCaret(
  prevDisplay: string,
  nextRaw: string,
  selectionStart: number,
  selectionEnd: number,
): PhoneEditResult {
  const prevDigits = ruDigitsFromDisplay(prevDisplay);
  let nextDigits = ruDigitsFromDisplay(nextRaw);

  const startIdx = digitIndexBefore(prevDisplay, selectionStart);
  const endIdx = digitIndexBefore(prevDisplay, selectionEnd);

  if (nextDigits.length < prevDigits.length && selectionStart === selectionEnd) {
    const removeAt = Math.max(0, startIdx - 1);
    nextDigits = prevDigits.slice(0, removeAt) + prevDigits.slice(removeAt + 1);
  } else if (nextRaw !== prevDisplay) {
    nextDigits = nextDigits;
  }

  const display = formatRuFromDigits(nextDigits);
  const caret = cursorAfterDigitIndex(display, startIdx + (nextDigits.length - prevDigits.length));

  return {
    display,
    digitCount: nextDigits.length > 0 ? nextDigits.length - 1 : 0,
    selectionStart: caret,
    selectionEnd: caret,
  };
}

/** Initial display for empty phone field. */
export function emptyRuPhoneDisplay(): string {
  return '+7';
}
