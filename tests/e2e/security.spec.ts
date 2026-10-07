import { test, expect } from '@playwright/test';

test.describe('security', () => {
  test('login page HTML does not expose JWT or deviceSession', async ({ page }) => {
    await page.goto('/login');
    const html = await page.content();
    expect(html).not.toContain('eyJ');
    expect(html).not.toContain('deviceSession');
  });
});
