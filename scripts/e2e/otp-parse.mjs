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
  const pipeIdx = line.indexOf('|');
  if (pipeIdx === -1) return null;
  try {
    const payload = JSON.parse(line.slice(pipeIdx + 1).trim());
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
export function lineMatchesRecipient(line, channel, to) {
  const lower = line.toLowerCase();
  if (channel === 'email') {
    return lower.includes(to.toLowerCase());
  }
  return smsNeedles(to).some((n) => lower.includes(n));
}

/**
 * @param {string} logs
 * @param {{ channel: 'email' | 'sms'; to: string; skipPriorMatches?: number }} opts
 * @returns {string | null}
 */
export function findOtpInLogs(logs, opts) {
  const { channel, to, skipPriorMatches = 0 } = opts;
  const lines = logs.split('\n').filter(Boolean);
  const matches = [];

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    const isMock =
      channel === 'email' ? line.includes('mock email sent') : line.includes('mock SMS sent');
    if (!isMock) continue;

    const prefersRecipient = lineMatchesRecipient(line, channel, to);
    const code = channel === 'email' ? extractEmailCode(line) : extractSmsCode(line);
    if (!code) continue;

    matches.push({ prefersRecipient, code: normalizeOtpDigits(code), index: i });
  }

  const withRecipient = matches.filter((m) => m.prefersRecipient);
  const pool = withRecipient.length > 0 ? withRecipient : matches;
  if (pool.length === 0) return null;

  const pick = pool[skipPriorMatches];
  if (!pick) return null;
  return pick.code.length === 6 ? pick.code : null;
}
