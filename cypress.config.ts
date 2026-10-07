import { defineConfig } from 'cypress';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);

type FetchOnboardingOtpArgs = {
  channel: 'email' | 'sms';
  to: string;
  skipPriorMatches?: number;
};

const otpScriptPath = path.join(__dirname, 'scripts/e2e/fetch-onboarding-otp.mjs');

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://127.0.0.1:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: !process.env.CI,
    screenshotOnRunFailure: true,
    env: {
      E2E_COMPOSE: process.env.CYPRESS_E2E_COMPOSE ?? '',
    },
    setupNodeEvents(on, config) {
      on('task', {
        async fetchOnboardingOtp(args: FetchOnboardingOtpArgs) {
          const argv = [otpScriptPath, args.channel, args.to];
          if (args.skipPriorMatches != null && args.skipPriorMatches > 0) {
            argv.push(String(args.skipPriorMatches));
          }
          const { stdout } = await execFileAsync(process.execPath, argv, {
            env: process.env,
          });
          return stdout.trim();
        },
      });
      return config;
    },
  },
});
