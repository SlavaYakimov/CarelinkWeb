#!/usr/bin/env node
/**
 * Parse member_invite_new / member_invite_existing bodies from notification mock logs.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { notificationLogArgv } from './carelink-auth-compose.mjs';
import { jsonLogPayload, lineMatchesRecipient } from './otp-parse.mjs';

const execFileAsync = promisify(execFile);

/**
 * @returns {Promise<string>}
 */
async function fetchNotificationLogs() {
  const logCmd = process.env.E2E_NOTIFICATION_LOG_CMD?.trim();
  if (logCmd) {
    const parts = logCmd.split(/\s+/);
    const { stdout } = await execFileAsync(parts[0], parts.slice(1), {
      maxBuffer: 8 * 1024 * 1024,
      env: process.env,
    });
    return stdout;
  }
  const { stdout } = await execFileAsync('docker', notificationLogArgv(), {
    maxBuffer: 8 * 1024 * 1024,
    env: process.env,
  });
  return stdout;
}

/**
 * @param {string} body
 */
function parseInviteEmailBody(body) {
  const workspaceLogin =
    body.match(/([a-z0-9.-]+@workspaces\.carelink\.app)/i)?.[1] ??
    body.match(/workspace[- ]?login[:\s]+(\S+@\S+)/i)?.[1] ??
    null;

  const tempPassword =
    body.match(/временн[^\n]*парол[^\n:]*[:\s]+(\S+)/i)?.[1] ??
    body.match(/temporary password[:\s]+(\S+)/i)?.[1] ??
    body.match(/парол[^\n:]*[:\s]+(\S{8,})/i)?.[1] ??
    null;

  const inviteCode =
    body.match(/[?&]code=([a-zA-Z0-9_-]{8,128})/)?.[1] ??
    body.match(/код[^\n:]*[:\s]+([a-zA-Z0-9_-]{8,128})/i)?.[1] ??
    null;

  return { workspaceLogin, tempPassword, inviteCode, bodySnippet: body.slice(0, 240) };
}

/**
 * @param {{ to: string; skipPriorMatches?: number; bodyIncludes?: string }} args
 */
export async function fetchMemberInviteEmail(args) {
  const { to, skipPriorMatches = 0, bodyIncludes = 'member_invite' } = args;
  const logs = await fetchNotificationLogs();
  const lines = logs.split('\n').filter(Boolean);
  const matches = [];

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (!line.includes('mock email sent')) continue;
    if (bodyIncludes && !line.toLowerCase().includes(bodyIncludes.toLowerCase())) continue;
    if (!lineMatchesRecipient(line, 'email', to)) continue;

    const payload = jsonLogPayload(line);
    const body = typeof payload?.body === 'string' ? payload.body : line;
    matches.push(parseInviteEmailBody(body));
  }

  if (matches.length <= skipPriorMatches) {
    throw new Error(`No member_invite email in logs for ${to} (matches=${matches.length})`);
  }
  return matches[skipPriorMatches];
}

const isMain = process.argv[1]?.endsWith('fetch-member-invite-email.mjs');
if (isMain) {
  const to = process.argv[2];
  const skip = Number.parseInt(process.argv[3] ?? '0', 10);
  fetchMemberInviteEmail({ to, skipPriorMatches: skip })
    .then((parsed) => {
      process.stdout.write(JSON.stringify(parsed));
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}
