// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { OtpInput } from '@/components/carelink/OtpInput';

describe('OtpInput', () => {
  it('renders single real input with one-time-code autocomplete', () => {
    render(<OtpInput id="email-otp" labelledBy="email-otp-label" value="" onChange={() => {}} />);
    const input = document.getElementById('email-otp');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    expect(input).toHaveAttribute('maxLength', '6');
    expect(input).toHaveAttribute('data-otp-input');
  });

  it('shows field error text', () => {
    render(<OtpInput id="otp-test" value="" onChange={() => {}} error="Неверный код" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Неверный код');
    expect(document.getElementById('otp-test')).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears value when error prop changes', () => {
    const onChange = vi.fn();
    const { rerender } = render(<OtpInput id="otp-test" value="123456" onChange={onChange} />);
    rerender(<OtpInput id="otp-test" value="123456" onChange={onChange} error="Неверный код" />);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('calls onFilled once when user enters six digits', () => {
    const onFilled = vi.fn();
    const onChange = vi.fn();
    render(<OtpInput id="otp-filled" value="" onChange={onChange} onFilled={onFilled} />);
    const input = document.getElementById('otp-filled') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '123456' } });
    expect(onFilled).toHaveBeenCalledTimes(1);
  });
});
