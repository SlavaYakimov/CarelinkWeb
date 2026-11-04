'use client';

/** Feature-detect Web OTP API (Android Chrome, etc.). */
export function isWebOtpSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'OTPCredential' in window &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials?.get === 'function'
  );
}

export type WebOtpOptions = {
  signal: AbortSignal;
};

export async function readWebOtpCode(options: WebOtpOptions): Promise<string | null> {
  if (!isWebOtpSupported()) return null;
  try {
    const cred = (await navigator.credentials.get({
      otp: { transport: ['sms'] },
      signal: options.signal,
    } as CredentialRequestOptions)) as OTPCredential | null;
    const code = cred?.code;
    if (typeof code !== 'string') return null;
    return code.replace(/\D/g, '').slice(0, 6) || null;
  } catch {
    return null;
  }
}
