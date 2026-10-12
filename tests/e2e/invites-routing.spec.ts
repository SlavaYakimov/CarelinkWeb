import { test, expect } from '@playwright/test';

test.describe('invites routing', () => {
  test('GET /invite without code redirects to unavailable', async ({ page }) => {
    await page.goto('/invite');
    await expect(page).toHaveURL(/\/invite\/unavailable\?reason=invalid_code/);
  });

  test('GET /invite?code= shows public landing', async ({ page }) => {
    await page.goto('/invite?code=validcode123456');
    await expect(page.getByRole('heading', { name: 'Вас пригласили в Carelink' })).toBeVisible();
  });

  test('GET /invites redirects unauthenticated to login', async ({ page }) => {
    await page.goto('/invites');
    await expect(page).toHaveURL(/\/login\?next=%2Finvites/);
  });
});
