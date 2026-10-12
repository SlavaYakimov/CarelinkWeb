// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordField } from '@/components/carelink/PasswordField';

describe('PasswordField a11y', () => {
  it('links input to requirements checklist via aria-describedby', () => {
    render(<PasswordField id="newPassword" value="" onChange={() => {}} />);
    const input = document.getElementById('newPassword');
    expect(input).toHaveAttribute('aria-describedby', 'newPassword-requirements');
    expect(document.getElementById('newPassword-requirements')).toBeTruthy();
  });

  it('includes error id in aria-describedby when error set', () => {
    render(
      <PasswordField
        id="pwd"
        value="x"
        onChange={() => {}}
        error="Ошибка"
        showRequirements={false}
      />,
    );
    const input = document.getElementById('pwd');
    expect(input?.getAttribute('aria-describedby')).toContain('pwd-error');
  });

  it('toggle meets 44px touch target', () => {
    render(<PasswordField id="pwd" value="secret" onChange={() => {}} showRequirements={false} />);
    const toggle = screen.getByRole('button', { name: 'Показать пароль' });
    expect(toggle.className).toMatch(/size-11|min-h-11/);
  });

  it('toggle exposes aria-pressed for visibility', async () => {
    const user = userEvent.setup();
    render(<PasswordField id="pwd" value="secret" onChange={() => {}} showRequirements={false} />);
    const toggle = screen.getByRole('button', { name: 'Показать пароль' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAccessibleName('Скрыть пароль');
  });
});
