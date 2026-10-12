// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { OtpInput } from '@/components/carelink/OtpInput';

describe('OtpInput Web OTP hook', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('calls onChange when Web OTP returns a code', async () => {
    vi.stubGlobal('OTPCredential', class OTPCredential {});
    vi.stubGlobal('navigator', {
      credentials: {
        get: vi.fn().mockResolvedValue({ code: '654321' }),
      },
    });

    const onChange = vi.fn();
    render(<OtpInput id="otp-web" value="" onChange={onChange} webOtp />);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('654321');
    });
  });

  it('skips Web OTP when webOtp=false', async () => {
    vi.stubGlobal('OTPCredential', class OTPCredential {});
    const get = vi.fn();
    vi.stubGlobal('navigator', { credentials: { get } });

    const onChange = vi.fn();
    render(<OtpInput id="otp-off" value="" onChange={onChange} webOtp={false} />);

    await waitFor(() => {
      expect(get).not.toHaveBeenCalled();
    });
  });
});
