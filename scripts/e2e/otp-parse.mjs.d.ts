export function jsonLogPayload(line: string): Record<string, unknown> | null;
export function extractEmailCode(line: string): string | null;
export function extractSmsCode(line: string): string | null;
export function normalizeOtpDigits(code: string): string;
export function smsNeedles(to: string): string[];
export function lineMatchesRecipient(line: string, channel: 'email' | 'sms', to: string): boolean;
export function findOtpInLogs(
  logs: string,
  opts: { channel: 'email' | 'sms'; to: string; skipPriorMatches?: number },
): string | null;
