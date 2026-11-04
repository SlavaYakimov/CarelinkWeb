// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isWebOtpSupported, readWebOtpCode } from '@/lib/client/web-otp';

describe('web OTP API', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('isWebOtpSupported is false without OTPCredential', () => {
    expect(isWebOtpSupported()).toBe(false);
  });

  it('readWebOtpCode returns null when unsupported', async () => {
    await expect(readWebOtpCode({ signal: new AbortController().signal })).resolves.toBeNull();
  });

  it('readWebOtpCode normalizes digits from credential', async () => {
    vi.stubGlobal('OTPCredential', class OTPCredential {});
    const get = vi.fn().mockResolvedValue({ code: '12-34 56' });
    vi.stubGlobal('navigator', { credentials: { get } });

    const code = await readWebOtpCode({ signal: new AbortController().signal });
    expect(code).toBe('123456');
    expect(get).toHaveBeenCalledWith(
      expect.objectContaining({
        otp: { transport: ['sms'] },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('readWebOtpCode returns null on abort/error', async () => {
    vi.stubGlobal('OTPCredential', class OTPCredential {});
    vi.stubGlobal('navigator', {
      credentials: {
        get: vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')),
      },
    });
    await expect(readWebOtpCode({ signal: new AbortController().signal })).resolves.toBeNull();
  });
});
