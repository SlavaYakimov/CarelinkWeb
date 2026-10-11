// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { OtpInput } from '@/components/carelink/OtpInput';

describe('OtpInput', () => {
  it('links OTP group to external label via labelledBy', () => {
    render(
      <div>
        <span id="email-otp-label">Код из письма</span>
        <OtpInput id="email-otp" labelledBy="email-otp-label" value="" onChange={() => {}} />
      </div>,
    );
    expect(screen.getByRole('group', { name: 'Код из письма' })).toBeInTheDocument();
  });

  it('renders built-in sr-only label when labelledBy is omitted', () => {
    render(<OtpInput id="phone-otp" labelText="Код из SMS" value="" onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'Код из SMS' })).toBeInTheDocument();
    expect(document.getElementById('phone-otp-label')).toHaveTextContent('Код из SMS');
  });

  it('calls onChange when digits are entered', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OtpInput id="otp-test" value="" onChange={onChange} length={6} />);
    const first = screen.getByLabelText('Цифра 1 из 6');
    await user.type(first, '5');
    expect(onChange).toHaveBeenCalled();
  });
});
