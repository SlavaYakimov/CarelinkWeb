// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from '@/components/carelink/FormField';
import { FormAlert } from '@/components/carelink/FormAlert';
import { Input } from '@/components/ui/input';

describe('FormField', () => {
  it('links label, control, hint and error via aria', () => {
    render(
      <FormField id="email" label="Почта" hint="Личная" error="Неверно">
        {(props) => <Input {...props} />}
      </FormField>,
    );
    const input = screen.getByLabelText(/Почта/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain('email-error');
    expect(screen.getByRole('alert')).toHaveTextContent('Неверно');
  });
});

describe('FormAlert', () => {
  it('renders destructive alert banner', () => {
    render(<FormAlert message="Сеть недоступна" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Сеть недоступна');
  });
});
