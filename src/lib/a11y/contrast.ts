/** WCAG 2.x relative luminance for sRGB hex colors (#rrggbb). */
function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) {
    throw new Error(`Expected #rrggbb, got ${hex}`);
  }
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function channelLinear(c: number): number {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex).map(channelLinear);
  const r = rgb[0] ?? 0;
  const g = rgb[1] ?? 0;
  const b = rgb[2] ?? 0;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two sRGB colors (1–21). */
export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = relativeLuminance(foregroundHex);
  const l2 = relativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Alpha blend of fg over bg (both #rrggbb, alpha 0–1). */
export function blendOver(fgHex: string, alpha: number, bgHex: string): string {
  const fgRgb = hexToRgb(fgHex);
  const bgRgb = hexToRgb(bgHex);
  const fr = fgRgb[0] ?? 0;
  const fg = fgRgb[1] ?? 0;
  const fb = fgRgb[2] ?? 0;
  const br = bgRgb[0] ?? 0;
  const bg = bgRgb[1] ?? 0;
  const bb = bgRgb[2] ?? 0;
  const a = Math.min(1, Math.max(0, alpha));
  const mix = (f: number, b: number) => Math.round((f * a + b * (1 - a)) * 255);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(fr, br))}${toHex(mix(fg, bg))}${toHex(mix(fb, bb))}`;
}
