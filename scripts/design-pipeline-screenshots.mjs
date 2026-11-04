#!/usr/bin/env node
/**
 * Capture desktop + mobile screenshots for design pipeline audit.
 * Usage: node scripts/design-pipeline-screenshots.mjs [baseUrl] [outDir]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3000';
const outDir =
  process.argv[3] ?? path.join(process.cwd(), 'artifacts', 'design-pipeline-screenshots');

/** @type {{ path: string; slug: string }[]} */
const routes = [
  { path: '/', slug: 'root' },
  { path: '/login', slug: 'login' },
  { path: '/login/recovery', slug: 'login-recovery' },
  { path: '/login/recovery/sent', slug: 'login-recovery-sent' },
  { path: '/login/recovery/confirm', slug: 'login-recovery-confirm' },
  { path: '/login/verify-sms', slug: 'login-verify-sms' },
  { path: '/login/verify-phone', slug: 'login-verify-phone' },
  { path: '/login/verify-push', slug: 'login-verify-push' },
  { path: '/login/temp-expired', slug: 'login-temp-expired' },
  { path: '/login/too-many', slug: 'login-too-many' },
  { path: '/login/change-password', slug: 'login-change-password' },
  { path: '/login/keeper', slug: 'login-keeper' },
  { path: '/login/keeper/expired', slug: 'login-keeper-expired' },
  { path: '/login/keeper/rejected', slug: 'login-keeper-rejected' },
  { path: '/onboarding/email', slug: 'onboarding-email' },
  { path: '/onboarding/phone', slug: 'onboarding-phone' },
  { path: '/onboarding/verify-email', slug: 'onboarding-verify-email' },
  { path: '/onboarding/existing', slug: 'onboarding-existing' },
  { path: '/onboarding/workspace', slug: 'onboarding-workspace' },
  { path: '/onboarding/password', slug: 'onboarding-password' },
  { path: '/onboarding/device', slug: 'onboarding-device' },
  { path: '/onboarding/done', slug: 'onboarding-done' },
  { path: '/invite?code=abcd1234', slug: 'invite-code' },
  { path: '/invite/unavailable', slug: 'invite-unavailable' },
  { path: '/invite/unavailable?reason=invalid_code', slug: 'invite-unavailable-invalid' },
  { path: '/delegate', slug: 'delegate' },
  { path: '/delegate/unavailable', slug: 'delegate-unavailable' },
  { path: '/help', slug: 'help' },
  { path: '/privacy', slug: 'privacy' },
  { path: '/terms', slug: 'terms' },
  { path: '/forbidden', slug: 'forbidden' },
  { path: '/session-ended', slug: 'session-ended' },
  { path: '/families', slug: 'families' },
  { path: '/families/new', slug: 'families-new' },
  { path: '/invites', slug: 'invites' },
  { path: '/invites/unavailable', slug: 'invites-unavailable' },
  { path: '/dev/kit', slug: 'dev-kit' },
];

const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
];

await mkdir(outDir, { recursive: true });
await mkdir(path.join(outDir, 'desktop'), { recursive: true });
await mkdir(path.join(outDir, 'mobile-390'), { recursive: true });

const browser = await chromium.launch();
const manifest = [];

for (const route of routes) {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();
    const url = `${baseUrl}${route.path}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
      await page.waitForTimeout(400);
      const file = `${route.slug}.png`;
      const filePath = path.join(outDir, vp.name, file);
      await page.screenshot({ path: filePath, fullPage: true });
      manifest.push({
        slug: route.slug,
        requested: route.path,
        finalUrl: page.url(),
        viewport: vp.name,
        file: path.relative(outDir, filePath),
      });
    } catch (err) {
      manifest.push({
        slug: route.slug,
        requested: route.path,
        viewport: vp.name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    await context.close();
  }
}

await browser.close();
await writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Saved ${manifest.filter((m) => m.file).length} screenshots to ${outDir}`);
