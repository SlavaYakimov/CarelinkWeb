import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_REPO_ROOT = path.resolve(__dirname, '../..');

const COMPOSE_FILES = [
  'docker-compose.yml',
  'e2e/docker-compose.e2e.yml',
  'e2e/docker-compose.web.yml',
];

export const NOTIFICATION_SERVICE = 'notification-service';

/**
 * @returns {string}
 */
export function resolveCarelinkAuthRoot() {
  const fromEnv = process.env.E2E_CARELINK_AUTH_ROOT?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(WEB_REPO_ROOT, '../CarelinkAuth');
}

/**
 * @param {string} root
 */
export function assertCarelinkAuthRoot(root) {
  const composePath = path.join(root, 'docker-compose.yml');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- E2E path from env
  if (!existsSync(composePath)) {
    throw new Error(
      `CarelinkAuth not found at ${root}. Clone https://github.com/SlavaYakimov/CarelinkAuth ` +
        'or set E2E_CARELINK_AUTH_ROOT. Then run: make compose-web-e2e-up',
    );
  }
}

/**
 * argv for execFile('docker', [...]) — notification logs (BE-21 stack).
 * @returns {string[]}
 */
export function notificationLogArgv() {
  const root = resolveCarelinkAuthRoot();
  assertCarelinkAuthRoot(root);

  const args = ['compose'];
  for (const file of COMPOSE_FILES) {
    args.push('-f', path.join(root, file));
  }
  args.push('logs', '--no-color', '--tail', '800', NOTIFICATION_SERVICE);
  return args;
}

/**
 * Shell-style command for E2E_NOTIFICATION_LOG_CMD override docs.
 * @returns {string}
 */
export function notificationLogCmdString() {
  const argv = notificationLogArgv();
  return argv.join(' ');
}

/**
 * argv for execFile('docker', [...]) — FLUSHALL on compose Redis (auth OTP rate limits).
 * @returns {string[]}
 */
export function composeRedisFlushArgv() {
  const root = resolveCarelinkAuthRoot();
  assertCarelinkAuthRoot(root);

  const args = ['compose'];
  for (const file of COMPOSE_FILES) {
    args.push('-f', path.join(root, file));
  }
  args.push('exec', '-T', 'redis', 'redis-cli', 'FLUSHALL');
  return args;
}
