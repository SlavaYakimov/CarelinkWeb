import { test, expect } from '@playwright/test';

test('GET /api/health responds with status payload', async ({ request }) => {
  const res = await request.get('/api/health');
  expect([200, 503]).toContain(res.status());
  const body = (await res.json()) as { status: string; checks?: unknown };
  expect(['ok', 'degraded']).toContain(body.status);
});
