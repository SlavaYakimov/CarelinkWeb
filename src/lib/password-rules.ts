/** Rules aligned with OpenAPI minLength (8) and backend WEAK_PASSWORD. */
export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: 'Не короче 8 символов',
    test: (v) => v.length >= 8,
  },
  {
    id: 'letter',
    label: 'Есть буква',
    test: (v) => /[A-Za-zА-Яа-яЁё]/.test(v),
  },
  {
    id: 'digit',
    label: 'Есть цифра',
    test: (v) => /\d/.test(v),
  },
];

export function isPasswordStrongEnough(value: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(value));
}
