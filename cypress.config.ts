import { defineConfig } from 'cypress';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);

type FetchOnboardingOtpArgs = {
  channel: 'email' | 'sms';
  to: string;
  skipPriorMatches?: number;
  minRecipientMatches?: number;
  excludeCode?: string;
};

const otpScriptPath = path.join(__dirname, 'scripts/e2e/fetch-onboarding-otp.mjs');
const flushRedisScriptPath = path.join(__dirname, 'scripts/e2e/flush-redis.mjs');
const approveRecoveryScriptPath = path.join(__dirname, 'scripts/e2e/approve-recovery-compose.mjs');
const seedRecoveryFlowScriptPath = path.join(__dirname, 'scripts/e2e/seed-recovery-sent-flow.mjs');

type ApproveRecoveryRequestArgs = {
  phoneDigits: string;
  keeperWorkspaceEmail?: string;
  keeperPassword?: string;
};

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://127.0.0.1:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: !process.env.CI,
    screenshotOnRunFailure: true,
    expose: {
      E2E_COMPOSE: process.env.CYPRESS_E2E_COMPOSE ?? '',
      recoveryWorkspaceEmail:
        process.env.CYPRESS_RECOVERY_WORKSPACE_EMAIL ?? 'yakimovs@workspaces.carelink.app',
      recoveryPhoneDigits: process.env.CYPRESS_RECOVERY_PHONE_DIGITS ?? '',
    },
    setupNodeEvents(on, config) {
      config.expose ??= {};
      config.expose.E2E_COMPOSE =
        process.env.CYPRESS_E2E_COMPOSE ?? config.expose.E2E_COMPOSE ?? '';
      on('task', {
        async flushE2eRedis() {
          await execFileAsync(process.execPath, [flushRedisScriptPath], {
            env: process.env,
          });
          return null;
        },
        async fetchOnboardingOtp(args: FetchOnboardingOtpArgs) {
          const argv = [otpScriptPath, args.channel, args.to];
          if (args.skipPriorMatches != null && args.skipPriorMatches > 0) {
            argv.push(String(args.skipPriorMatches));
          }
          if (args.minRecipientMatches != null && args.minRecipientMatches > 1) {
            argv.push('--min-recipient-matches', String(args.minRecipientMatches));
          }
          if (args.excludeCode) {
            argv.push('--exclude-code', args.excludeCode);
          }
          const { stdout } = await execFileAsync(process.execPath, argv, {
            env: process.env,
          });
          return stdout.trim();
        },
        async approveRecoveryRequest(args: ApproveRecoveryRequestArgs) {
          const taskEnv = { ...process.env };
          if (args.keeperWorkspaceEmail) {
            taskEnv.E2E_RECOVERY_KEEPER_WORKSPACE_EMAIL = args.keeperWorkspaceEmail;
          }
          if (args.keeperPassword) {
            taskEnv.E2E_RECOVERY_KEEPER_PASSWORD = args.keeperPassword;
          }
          const { stdout } = await execFileAsync(
            process.execPath,
            [approveRecoveryScriptPath, args.phoneDigits],
            { env: taskEnv },
          );
          const parsed = JSON.parse(stdout.trim()) as { requestId: string; smsCode: string };
          return parsed;
        },
        async seedRecoverySentFlow(args: { familySlug: string; phoneDigits: string }) {
          const { stdout } = await execFileAsync(
            process.execPath,
            [seedRecoveryFlowScriptPath, args.familySlug, args.phoneDigits],
            { env: process.env },
          );
          return JSON.parse(stdout.trim()) as { fid: string; flowCookieName: string };
        },
      });
      return config;
    },
  },
});
