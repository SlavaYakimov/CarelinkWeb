import { test, expect } from '@playwright/test';

test.describe('onboarding routing', () => {
  test('GET /onboarding/email shows step shell', async ({ page }) => {
    await page.goto('/onboarding/email');
    await expect(page.getByRole('heading', { name: 'Личная почта' })).toBeVisible();
  });

  test('GET /onboarding/password without flow redirects to email', async ({ page }) => {
    await page.goto('/onboarding/password');
    await expect(page).toHaveURL(/\/onboarding\/email$/);
  });

  test('GET /onboarding/done without flow redirects to email', async ({ page }) => {
    await page.goto('/onboarding/done');
    await expect(page).toHaveURL(/\/onboarding\/email$/);
  });
});
