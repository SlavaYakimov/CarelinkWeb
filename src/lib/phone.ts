/** Normalizes Russian phone input to E.164 (+7XXXXXXXXXX). */
export function normalizeRuPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+7${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`;
  }
  return null;
}

export function formatRuPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  let d = digits;
  if (d.startsWith('8')) d = `7${d.slice(1)}`;
  if (!d.startsWith('7')) d = `7${d}`;
  d = d.slice(0, 11);
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
