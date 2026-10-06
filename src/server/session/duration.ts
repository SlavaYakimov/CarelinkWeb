const UNITS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
};

/** Parses duration strings like `7d`, `15m`, `12h` into seconds. */
export function parseDurationToSeconds(raw: string): number {
  const m = /^(\d+)([smhdw])$/.exec(raw.trim());
  if (!m) throw new Error(`Invalid duration: ${raw}`);
  const n = Number(m[1]);
  const unit = m[2]!;
  const mul = UNITS[unit];
  if (!mul) throw new Error(`Invalid duration unit: ${raw}`);
  return n * mul;
}

export function parseDurationToMs(raw: string): number {
  return parseDurationToSeconds(raw) * 1000;
}
