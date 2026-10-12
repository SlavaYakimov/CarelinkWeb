import { isPasswordStrongEnough } from '@/lib/password-rules';

export function passwordsMatch(newPassword: string, confirmPassword: string): boolean {
  return newPassword.length > 0 && newPassword === confirmPassword;
}

export function canSubmitPasswordPair(newPassword: string, confirmPassword: string): boolean {
  return isPasswordStrongEnough(newPassword) && passwordsMatch(newPassword, confirmPassword);
}
