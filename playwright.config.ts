import { defineConfig, devices } from '@playwright/test';

const e2eServerEnv: Record<string, string> = {
  APP_ENV: 'development',
  APP_ORIGIN: 'http://127.0.0.1:3000',
  GATEWAY_URL: process.env.GATEWAY_URL ?? 'http://127.0.0.1:8088',
  REDIS_URL: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  SESSION_ENC_KEY: process.env.SESSION_ENC_KEY ?? Buffer.alloc(32, 9).toString('base64'),
  COOKIE_SECURE: 'false',
  COOKIE_PREFIX: '',
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm start',
    url: 'http://127.0.0.1:3000/login',
    reuseExistingServer: !process.env.CI,
    env: e2eServerEnv,
  },
});
