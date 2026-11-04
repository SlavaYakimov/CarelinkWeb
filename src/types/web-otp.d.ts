/** Web OTP API (Chromium); see https://wicg.github.io/web-otp/ */
interface OTPCredential extends Credential {
  code: string;
}

interface CredentialRequestOptions {
  otp?: { transport: ('sms' | 'email')[] };
}
