import { test, expect } from '@playwright/test';

test.describe('routing', () => {
  test('GET / redirects guest to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('GET /families without session redirects to login with next', async ({ page }) => {
    await page.goto('/families');
    await expect(page).toHaveURL(/\/login\?next=%2Ffamilies/);
  });
});
