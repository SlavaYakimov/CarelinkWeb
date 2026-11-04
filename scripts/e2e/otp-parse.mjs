/**
 * OTP extraction from CarelinkAuth notification mock logs (parity with e2e/otp.py).
 */

const EMAIL_CODE_RE = /(?:Code|Код):\s*(\d{3}-\d{3}|\d{6})/i;
const OTP_CODE_FIELD_RE = /"otp_code"\s*:\s*"([^"]+)"/;
const SMS_BODY_RE = /"body"\s*:\s*"[^"]*?(\d{4,6})/;

/**
 * @param {string} line
 * @returns {Record<string, unknown> | null}
 */
export function jsonLogPayload(line) {
  if (!line.includes('mock email sent') && !line.includes('mock SMS sent')) {
    return null;
  }
  const braceIdx = line.indexOf('{');
  const jsonText =
    braceIdx !== -1 ? line.slice(braceIdx).trim() : line.slice(line.lastIndexOf('|') + 1).trim();
  try {
    const payload = JSON.parse(jsonText);
    return typeof payload === 'object' && payload !== null ? payload : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} line
 * @returns {string | null} raw code (may include dash)
 */
export function extractEmailCode(line) {
  const fieldMatch = OTP_CODE_FIELD_RE.exec(line);
  if (fieldMatch) return fieldMatch[1];

  const payload = jsonLogPayload(line);
  if (payload) {
    const otpCode = payload.otp_code;
    if (typeof otpCode === 'string' && otpCode) return otpCode;
    const body = payload.body;
    if (typeof body === 'string') {
      const match = EMAIL_CODE_RE.exec(body);
      if (match) return match[1];
    }
  }

  const match = EMAIL_CODE_RE.exec(line);
  if (match) return match[1];
  return null;
}

/**
 * @param {string} line
 * @returns {string | null} digits only
 */
export function extractSmsCode(line) {
  if (!line.includes('mock SMS sent')) return null;

  const fieldMatch = OTP_CODE_FIELD_RE.exec(line);
  if (fieldMatch) return fieldMatch[1].replace(/-/g, '');

  const payload = jsonLogPayload(line);
  if (payload) {
    const otpCode = payload.otp_code;
    if (typeof otpCode === 'string' && otpCode) return otpCode.replace(/-/g, '');
    const body = payload.body;
    if (typeof body === 'string') {
      const digits = body.match(/\d{4,6}/g);
      if (digits?.length) return digits[digits.length - 1];
    }
  }

  const bodyMatch = SMS_BODY_RE.exec(line);
  if (bodyMatch) return bodyMatch[1];

  const fallback = line.match(/\b(\d{4,6})\b/);
  if (fallback) return fallback[1];
  return null;
}

/**
 * @param {string} code
 * @returns {string} 6 digits for Cypress fillOtp
 */
export function normalizeOtpDigits(code) {
  const digits = code.replace(/\D/g, '');
  if (digits.length >= 6) return digits.slice(0, 6);
  return digits;
}

/**
 * @param {string} to
 * @returns {string[]}
 */
export function smsNeedles(to) {
  const digits = to.replace(/\D/g, '');
  const needles = [to.toLowerCase()];
  if (digits.length >= 10) {
    needles.push(digits.slice(-10));
    needles.push(`+7${digits.slice(-10)}`);
    needles.push(`7${digits.slice(-10)}`);
  }
  return [...new Set(needles)];
}

/**
 * @param {string} line
 * @param {string} to
 * @returns {boolean}
 */
/**
 * CarelinkAuth mock logs SMS with phone_mask (+79******844), not full E.164.
 */
function normalizeRuMobileDigits(digits) {
  if (digits.length === 10 && digits.startsWith('9')) return `7${digits}`;
  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`;
  return digits;
}

function maskMatchesPhoneDigits(phoneMask, toDigits) {
  if (!phoneMask || !toDigits) return false;
  const normalized = normalizeRuMobileDigits(toDigits.replace(/\D/g, ''));
  const suffixMatch = phoneMask.match(/(\d+)$/);
  const prefixMatch = phoneMask.match(/^\+?(\d+)/);
  if (!suffixMatch || !prefixMatch) return false;
  const suffix = suffixMatch[1];
  const prefix = prefixMatch[1];
  return normalized.endsWith(suffix) && normalized.startsWith(prefix);
}

/**
 * Match CarelinkAuth `email_mask` to a full recipient address.
 *
 * Supports legacy masks (visible local prefix + full domain, e.g. `e2***@example.com`)
 * and domain-redacted masks (e.g. `e***@e***.com` for `e2e+…@example.com`).
 *
 * Limitation: if two different addresses share the same visible local prefix, the same
 * first domain-label character, and the same TLD (e.g. `eve@email.com` vs `e2e@example.com`
 * both match `e***@e***.com`), the mask alone cannot distinguish them — `findOtpInLogs`
 * then relies on log order (newest matching line first) and the caller's explicit `to`.
 */
function localPartMatchesEmailMask(maskLocal, toLocal) {
  if (!maskLocal.includes('*')) {
    return maskLocal === toLocal;
  }

  // Fixed-width mask: one `*` per hidden character (e.g. `e2***` → 5-char local).
  if (maskLocal.length === toLocal.length) {
    for (let i = 0; i < maskLocal.length; i += 1) {
      if (maskLocal[i] === '*') continue;
      if (maskLocal[i] !== toLocal[i]) return false;
    }
    return true;
  }

  // Variable-length local: visible prefix then `***` wildcard run.
  const prefixMatch = maskLocal.match(/^([^*]+)\*+$/);
  if (prefixMatch) {
    const prefix = prefixMatch[1];
    return toLocal.startsWith(prefix) && toLocal.length >= prefix.length;
  }

  return false;
}

function domainPartMatchesEmailMask(maskDomain, toDomain) {
  if (!maskDomain.includes('*')) {
    return maskDomain === toDomain;
  }

  const maskDot = maskDomain.lastIndexOf('.');
  const toDot = toDomain.lastIndexOf('.');
  if (maskDot === -1 || toDot === -1) return false;

  const maskTld = maskDomain.slice(maskDot + 1);
  const toTld = toDomain.slice(toDot + 1);
  if (maskTld !== toTld) return false;

  const maskLabel = maskDomain.slice(0, maskDot);
  const toLabel = toDomain.slice(0, toDot);

  if (!maskLabel.includes('*')) {
    return maskLabel === toLabel;
  }

  if (maskLabel.length === toLabel.length) {
    for (let i = 0; i < maskLabel.length; i += 1) {
      if (maskLabel[i] === '*') continue;
      if (maskLabel[i] !== toLabel[i]) return false;
    }
    return true;
  }

  const labelPrefixMatch = maskLabel.match(/^([^*]+)\*+$/);
  if (labelPrefixMatch) {
    const prefix = labelPrefixMatch[1];
    return toLabel.startsWith(prefix) && toLabel.length >= prefix.length;
  }

  return false;
}

export function maskMatchesEmail(emailMask, to) {
  const at = emailMask.indexOf('@');
  if (at === -1) return false;
  const maskLocal = emailMask.slice(0, at);
  const maskDomain = emailMask.slice(at + 1).toLowerCase();
  const toLower = to.toLowerCase();
  const toAt = toLower.indexOf('@');
  if (toAt === -1) return false;
  const toLocal = toLower.slice(0, toAt);
  const toDomain = toLower.slice(toAt + 1);

  if (!localPartMatchesEmailMask(maskLocal, toLocal)) return false;
  return domainPartMatchesEmailMask(maskDomain, toDomain);
}

export function lineMatchesRecipient(line, channel, to) {
  const lower = line.toLowerCase();
  if (channel === 'email') {
    if (lower.includes(to.toLowerCase())) return true;
    const payload = jsonLogPayload(line);
    if (payload && typeof payload.email_mask === 'string') {
      return maskMatchesEmail(payload.email_mask, to);
    }
    return false;
  }
  const toDigits = to.replace(/\D/g, '');
  if (smsNeedles(to).some((n) => lower.includes(n))) return true;

  const payload = jsonLogPayload(line);
  if (payload && typeof payload.phone_mask === 'string') {
    return maskMatchesPhoneDigits(payload.phone_mask, toDigits);
  }
  return false;
}

/**
 * @param {string} logs
 * @param {{ channel: 'email' | 'sms'; to: string; skipPriorMatches?: number }} opts
 * @returns {string | null}
 */
/**
 * @param {string} logs
 * @param {{ channel: 'email' | 'sms'; to: string }} opts
 */
function lineMatchesBodyIncludes(line, bodyIncludes) {
  if (!bodyIncludes) return true;
  const lower = line.toLowerCase();
  const needle = bodyIncludes.toLowerCase();
  return lower.includes(needle);
}

export function countRecipientOtpInLogs(logs, opts) {
  const { channel, to, bodyIncludes } = opts;
  const lines = logs.split('\n').filter(Boolean);
  let count = 0;
  for (const line of lines) {
    const isMock =
      channel === 'email' ? line.includes('mock email sent') : line.includes('mock SMS sent');
    if (!isMock) continue;
    if (!lineMatchesBodyIncludes(line, bodyIncludes)) continue;
    if (lineMatchesRecipient(line, channel, to)) count += 1;
  }
  return count;
}

export function findOtpInLogs(logs, opts) {
  const {
    channel,
    to,
    skipPriorMatches = 0,
    minRecipientMatches = 1,
    excludeCode,
    bodyIncludes,
  } = opts;
  const lines = logs.split('\n').filter(Boolean);
  const matches = [];

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    const isMock =
      channel === 'email' ? line.includes('mock email sent') : line.includes('mock SMS sent');
    if (!isMock) continue;
    if (!lineMatchesBodyIncludes(line, bodyIncludes)) continue;

    const prefersRecipient = lineMatchesRecipient(line, channel, to);
    const code = channel === 'email' ? extractEmailCode(line) : extractSmsCode(line);
    if (!code) continue;

    matches.push({ prefersRecipient, code: normalizeOtpDigits(code), index: i });
  }

  const withRecipient = matches.filter((m) => m.prefersRecipient);
  let pool = withRecipient.length > 0 ? withRecipient : matches;
  if (excludeCode) {
    pool = pool.filter((m) => m.code !== excludeCode);
  }
  if (pool.length === 0 || withRecipient.length < minRecipientMatches) return null;

  const pick = pool[skipPriorMatches];
  if (!pick) return null;
  // Sign-in phone OTP is 4 digits; device/onboarding SMS uses 6.
  return pick.code.length >= 4 ? pick.code : null;
}
