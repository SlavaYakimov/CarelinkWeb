import { test, expect } from '@playwright/test';

test.describe('login page', () => {
  test('shows workspace login shell', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Вход в Carelink' })).toBeVisible();
    await expect(page.locator('#workspaceSlug')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('link', { name: /Забыли пароль/ })).toHaveAttribute(
      'href',
      '/login/recovery',
    );
  });
});
