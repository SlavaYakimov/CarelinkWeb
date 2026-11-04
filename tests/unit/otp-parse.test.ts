import { describe, it, expect } from 'vitest';
import {
  extractEmailCode,
  extractSmsCode,
  findOtpInLogs,
  lineMatchesRecipient,
  normalizeOtpDigits,
} from '../../scripts/e2e/otp-parse.mjs';

describe('otp-parse', () => {
  it('extracts email code from JSON mock log', () => {
    const line =
      'info | mock email sent | {"to":"e2e@example.com","otp_code":"482916","body":"Code: 482-916"}';
    expect(extractEmailCode(line)).toBe('482916');
    expect(normalizeOtpDigits('482-916')).toBe('482916');
  });

  it('extracts email code from plain Code line', () => {
    const line = 'mock email sent to user Code: 123-456';
    expect(extractEmailCode(line)).toBe('123-456');
  });

  it('extracts SMS code from JSON mock log', () => {
    const line =
      'info | mock SMS sent | {"to":"+79001234567","otp_code":"654321","body":"Your code 654321"}';
    expect(extractSmsCode(line)).toBe('654321');
  });

  it('findOtpInLogs returns 4-digit sign-in phone OTP without padding to six', () => {
    const line = 'info | mock SMS sent | {"to":"+79001234567","otp_code":"4829","body":"Код 4829"}';
    const logs = ['mock SMS sent | {"to":"+79001234567","otp_code":"111111"}', line].join('\n');
    expect(findOtpInLogs(logs, { channel: 'sms', to: '9001234567', skipPriorMatches: 0 })).toBe(
      '4829',
    );
    expect(normalizeOtpDigits('4829')).toBe('4829');
  });

  it('findOtpInLogs prefers recipient match', () => {
    const logs = [
      'mock SMS sent | {"to":"+79990001122","otp_code":"111111"}',
      'mock SMS sent | {"to":"+79001234567","otp_code":"222222"}',
    ].join('\n');
    expect(findOtpInLogs(logs, { channel: 'sms', to: '9001234567' })).toBe('222222');
  });

  it('findOtpInLogs filters recovery SMS by bodyIncludes', () => {
    const logs = [
      'mock SMS sent | {"phone_mask":"+79******567","body":"Carelink: код 123456. Никому не сообщайте.","otp_code":"123456"}',
      'mock SMS sent | {"phone_mask":"+79******567","body":"Carelink: код 987654 для восстановления. Действует 15 мин.","otp_code":"987654"}',
    ].join('\n');
    expect(
      findOtpInLogs(logs, {
        channel: 'sms',
        to: '9001234567',
        bodyIncludes: 'восстановлен',
      }),
    ).toBe('987654');
  });

  it('lineMatchesRecipient matches legacy full-domain email_mask', () => {
    const line = 'info | mock email sent | {"email_mask":"e2***@example.com","otp_code":"111111"}';
    expect(lineMatchesRecipient(line, 'email', 'e2e.list@example.com')).toBe(true);
    expect(lineMatchesRecipient(line, 'email', 'e2e+1730000000@example.com')).toBe(true);
    expect(lineMatchesRecipient(line, 'email', 'alice@example.com')).toBe(false);
  });

  it('lineMatchesRecipient matches domain-redacted email_mask (CarelinkAuth a995396f+)', () => {
    const line =
      'info | mock email sent | {"email_mask":"e***@e***.com","otp_code":"482916","body":"Code: 482-916"}';
    expect(lineMatchesRecipient(line, 'email', 'e2e+1730000000@example.com')).toBe(true);
    expect(lineMatchesRecipient(line, 'email', 'eve@example.com')).toBe(true);
    expect(lineMatchesRecipient(line, 'email', 'alice@example.com')).toBe(false);
    expect(lineMatchesRecipient(line, 'email', 'e2e+1730000000@email.com')).toBe(true);
    expect(lineMatchesRecipient(line, 'email', 'e2e+1730000000@example.org')).toBe(false);
  });

  it('findOtpInLogs picks newest email OTP for masked recipient', () => {
    const to = 'e2e+1730000001@example.com';
    const logs = [
      'mock email sent | {"email_mask":"e***@e***.com","otp_code":"111111"}',
      'mock email sent | {"email_mask":"e***@e***.com","otp_code":"222222"}',
    ].join('\n');
    expect(findOtpInLogs(logs, { channel: 'email', to })).toBe('222222');
    expect(findOtpInLogs(logs, { channel: 'email', to, skipPriorMatches: 1 })).toBe('111111');
  });

  it('findOtpInLogs ignores mock email for non-matching address', () => {
    const logs =
      'mock email sent | {"email_mask":"e***@e***.com","otp_code":"999999","body":"Code: 999-999"}';
    expect(findOtpInLogs(logs, { channel: 'email', to: 'owner@other.org' })).toBeNull();
  });

  it('findOtpInLogs supports skipPriorMatches for older SMS', () => {
    const logs = [
      'mock SMS sent | {"to":"+79001234567","otp_code":"111111"}',
      'mock SMS sent | {"to":"+79001234567","otp_code":"222222"}',
    ].join('\n');
    expect(findOtpInLogs(logs, { channel: 'sms', to: '9001234567', skipPriorMatches: 0 })).toBe(
      '222222',
    );
    expect(findOtpInLogs(logs, { channel: 'sms', to: '9001234567', skipPriorMatches: 1 })).toBe(
      '111111',
    );
  });
});
