import { describe, it, expect } from 'vitest';
/* eslint-disable @typescript-eslint/ban-ts-comment -- scripts/e2e .mjs helper */
// @ts-ignore
import {
  extractEmailCode,
  extractSmsCode,
  findOtpInLogs,
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

  it('findOtpInLogs prefers recipient match', () => {
    const logs = [
      'mock SMS sent | {"to":"+79990001122","otp_code":"111111"}',
      'mock SMS sent | {"to":"+79001234567","otp_code":"222222"}',
    ].join('\n');
    expect(findOtpInLogs(logs, { channel: 'sms', to: '9001234567' })).toBe('222222');
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
