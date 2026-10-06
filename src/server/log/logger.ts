import 'server-only';
import pino from 'pino';
import { getEnv } from '@/env';

const redactPaths = [
  '*.phone',
  '*.email',
  '*.password',
  '*.newPassword',
  '*.oldPassword',
  '*.code',
  '*.token',
  '*.refresh',
  '*.access',
  '*.userRefresh',
  '*.deviceSession',
  '*.registrationToken',
  '*.approvalSecret',
  'req.headers.cookie',
  'req.headers.authorization',
  'headers.cookie',
  'headers.authorization',
  'headers["x-device-session"]',
  'headers["x-user-refresh"]',
];

let log: pino.Logger | undefined;

export function getLogger(): pino.Logger {
  if (!log) {
    const { LOG_LEVEL, APP_ENV } = getEnv();
    log = pino({
      level: LOG_LEVEL,
      redact: {
        paths: redactPaths,
        censor: '[Redacted]',
      },
      ...(APP_ENV === 'development' ? { transport: undefined } : {}),
    });
  }
  return log;
}
