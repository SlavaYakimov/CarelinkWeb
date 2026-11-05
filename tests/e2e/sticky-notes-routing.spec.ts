import { test, expect } from '@playwright/test';

test.describe('sticky-notes routing', () => {
  test('guest redirected from family sticky-notes', async ({ page }) => {
    await page.goto('/families/11111111-1111-4111-8111-111111111111/sticky-notes');
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test('guest redirected from family members labels', async ({ page }) => {
    await page.goto('/families/11111111-1111-4111-8111-111111111111/members');
    await expect(page).toHaveURL(/\/login\?next=/);
  });
});
