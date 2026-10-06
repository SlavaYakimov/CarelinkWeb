// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OtpInput } from '@/components/carelink/OtpInput';
import { PhoneInput } from '@/components/carelink/PhoneInput';
import { PasswordField } from '@/components/carelink/PasswordField';

describe('Carelink inputs', () => {
  it('OtpInput accepts digits and shows error', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} error="Неверный код" id="otp-test" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Неверный код');
    const first = screen.getByLabelText('Цифра 1 из 6');
    await user.type(first, '1');
    expect(onChange).toHaveBeenCalled();
  });

  it('PhoneInput renders label and formats value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PhoneInput value="+7" onChange={onChange} />);
    const input = screen.getByLabelText('Телефон');
    await user.type(input, '9001234567');
    expect(onChange).toHaveBeenCalled();
  });

  it('PasswordField toggles visibility', async () => {
    const user = userEvent.setup();
    render(<PasswordField value="secret" onChange={() => undefined} showRequirements={false} />);
    const input = screen.getByLabelText('Пароль');
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Показать пароль' }));
    expect(input).toHaveAttribute('type', 'text');
  });
});
