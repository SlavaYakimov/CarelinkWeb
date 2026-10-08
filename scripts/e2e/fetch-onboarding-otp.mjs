#!/usr/bin/env node
/**
 * Fetches onboarding OTP from CarelinkAuth notification mock logs (BE-21 compose).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { notificationLogArgv } from './carelink-auth-compose.mjs';
import { countRecipientOtpInLogs, findOtpInLogs } from './otp-parse.mjs';

const exec = promisify(execFile);

const POLL_RETRIES = 30;
const POLL_INTERVAL_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @returns {Promise<string>}
 */
/**
 * @param {string} phoneDigits
 * @returns {Promise<number>}
 */
/**
 * @param {string} phoneDigits
 * @param {{ bodyIncludes?: string }} [filter]
 */
export async function countRecipientSmsInLogs(phoneDigits, filter) {
  const logs = await fetchNotificationLogs();
  return countRecipientOtpInLogs(logs, {
    channel: 'sms',
    to: phoneDigits,
    bodyIncludes: filter?.bodyIncludes,
  });
}

async function fetchNotificationLogs() {
  const logCmd = process.env.E2E_NOTIFICATION_LOG_CMD?.trim();
  if (logCmd) {
    const parts = logCmd.split(/\s+/);
    const bin = parts[0];
    const args = parts.slice(1);
    const { stdout } = await exec(bin, args, {
      maxBuffer: 8 * 1024 * 1024,
      env: process.env,
    });
    return stdout;
  }

  const { stdout } = await exec('docker', notificationLogArgv(), {
    maxBuffer: 8 * 1024 * 1024,
    env: process.env,
  });
  return stdout;
}

/**
 * @param {{ channel: 'email' | 'sms'; to: string; skipPriorMatches?: number }} args
 * @returns {Promise<string>} 6-digit code
 */
export async function fetchOnboardingOtp(args) {
  const {
    channel,
    to,
    skipPriorMatches = 0,
    minRecipientMatches = 1,
    excludeCode,
    bodyIncludes,
  } = args;
  if (!channel || !to) {
    throw new Error('fetchOnboardingOtp requires { channel, to }');
  }

  let lastError = null;

  for (let attempt = 0; attempt < POLL_RETRIES; attempt += 1) {
    try {
      const logs = await fetchNotificationLogs();
      const code = findOtpInLogs(logs, {
        channel,
        to,
        skipPriorMatches,
        minRecipientMatches,
        excludeCode,
        bodyIncludes,
      });
      if (code) return code;
      lastError = new Error(
        `No ${channel} OTP in logs for recipient (attempt ${attempt + 1}/${POLL_RETRIES})`,
      );
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (
        lastError.message.includes('CarelinkAuth not found') ||
        lastError.message.includes('OTP fetch not configured')
      ) {
        throw lastError;
      }
    }

    if (attempt < POLL_RETRIES - 1) {
      await sleep(POLL_INTERVAL_MS);
    }
  }

  throw new Error(
    `No ${channel} OTP found in notification logs for ${to} after ${POLL_RETRIES}s. ` +
      'Check compose mock logs (SMS_MOCK_LOG / EMAIL_MOCK_LOG) and notification-service. ' +
      (lastError instanceof Error ? lastError.message : ''),
  );
}

function parseFetchCliArgs(argv) {
  let skipPriorMatches = 0;
  let minRecipientMatches = 1;
  let excludeCode;
  const positional = [];
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--min-recipient-matches') {
      const n = Number.parseInt(argv[i + 1] ?? '', 10);
      if (!Number.isNaN(n)) minRecipientMatches = n;
      i += 1;
      continue;
    }
    if (arg === '--exclude-code') {
      excludeCode = argv[i + 1];
      i += 1;
      continue;
    }
    positional.push(arg);
  }
  const skip = positional[2] ? Number.parseInt(positional[2], 10) : 0;
  return {
    channel: positional[0],
    to: positional[1],
    skipPriorMatches: Number.isNaN(skip) ? 0 : skip,
    minRecipientMatches,
    excludeCode,
  };
}

const isMain = process.argv[1]?.endsWith('fetch-onboarding-otp.mjs');
if (isMain) {
  fetchOnboardingOtp(parseFetchCliArgs(process.argv))
    .then((code) => {
      process.stdout.write(code);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}
