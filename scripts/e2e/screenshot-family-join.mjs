#!/usr/bin/env node
/**
 * Playwright screenshots of family-join pages (requires build, redis, mock gateway, next start).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvLocal } from './load-env-local.mjs';
import { seedJoinFlow } from './seed-join-flow.mjs';
import { seedKeeperSession } from './seed-keeper-session.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = process.env.SCREENSHOT_OUT ?? '/opt/cursor/artifacts/screenshots/family-join-live';

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function waitForHttp(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
    } catch {
      /* retry */
    }
    await sleep(500);
  }
  throw new Error(`timeout waiting for ${url}`);
}

async function main() {
  loadEnvLocal();
  fs.mkdirSync(outDir, { recursive: true });

  const mock = spawn(
    process.execPath,
    [path.join(root, 'scripts/e2e/mock-gateway-family-join.mjs')],
    {
      cwd: root,
      env: process.env,
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );

  await new Promise((resolve, reject) => {
    mock.stdout?.once('data', () => resolve(undefined));
    mock.on('error', reject);
  });

  const next = spawn('pnpm', ['start'], { cwd: root, env: process.env, stdio: 'ignore' });
  await waitForHttp('http://127.0.0.1:3000/login');

  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  const base = 'http://127.0.0.1:3000';

  const shots = [
    {
      name: '45-join-choice',
      async prepare(ctx) {
        const { fid, flowCookieName } = await seedJoinFlow({
          step: 'choice',
          personalEmail: 'mama@example.com',
        });
        await ctx.addCookies([
          { name: flowCookieName, value: fid, url: base, httpOnly: true, sameSite: 'Lax' },
        ]);
      },
      path: '/join/choice',
    },
    {
      name: '46-email-taken',
      async prepare(ctx) {
        const { fid, flowCookieName } = await seedJoinFlow({
          step: 'taken',
          personalEmail: 'anna@example.com',
        });
        await ctx.addCookies([
          { name: flowCookieName, value: fid, url: base, httpOnly: true, sameSite: 'Lax' },
        ]);
      },
      path: '/invites/email/taken',
    },
    {
      name: '53-email-verify',
      async prepare(ctx) {
        const { fid, flowCookieName } = await seedJoinFlow({
          step: 'verify',
          personalEmail: 'mama@example.com',
        });
        await ctx.addCookies([
          { name: flowCookieName, value: fid, url: base, httpOnly: true, sameSite: 'Lax' },
        ]);
      },
      path: '/invites/email/verify',
    },
    {
      name: '48-qr-join',
      async prepare(ctx) {
        const { fid, flowCookieName } = await seedJoinFlow({
          step: 'qr',
          joinToken: 'e2ejointoken0001',
          joinFamilyName: 'Семья Якимовых',
          joinKeeperDisplayName: 'Слава',
          joinRoleLabel: 'Участник',
          joinExpiresAt: new Date(Date.now() + 86400000).toISOString(),
        });
        await ctx.addCookies([
          { name: flowCookieName, value: fid, url: base, httpOnly: true, sameSite: 'Lax' },
        ]);
      },
      path: '/join',
    },
    {
      name: '52-pending',
      async prepare(ctx) {
        const { fid, flowCookieName } = await seedJoinFlow({
          step: 'pending',
          joinKeeperDisplayName: 'Слава',
        });
        await ctx.addCookies([
          { name: flowCookieName, value: fid, url: base, httpOnly: true, sameSite: 'Lax' },
        ]);
      },
      path: '/join/pending',
    },
    {
      name: '50-already-in-family',
      path: '/join/unavailable?reason=already_in_family',
    },
    {
      name: '51-expired',
      path: '/join/unavailable?reason=expired',
    },
    {
      name: '49-create-family',
      async prepare(ctx) {
        const { fid, flowCookieName } = await seedJoinFlow({
          step: 'create-family',
          joinUserRefresh: 'refresh-e2e',
        });
        await ctx.addCookies([
          { name: flowCookieName, value: fid, url: base, httpOnly: true, sameSite: 'Lax' },
        ]);
      },
      path: '/join/create-family',
    },
    {
      name: '48b-recovery-email',
      async prepare(ctx) {
        const { fid, flowCookieName } = await seedJoinFlow({
          step: 'pending',
          joinKeeperDisplayName: 'Слава',
        });
        await ctx.addCookies([
          { name: flowCookieName, value: fid, url: base, httpOnly: true, sameSite: 'Lax' },
        ]);
      },
      path: '/join/recovery-email',
    },
    {
      name: '47-keeper-qr',
      async prepare(ctx) {
        const { sid, sessionCookieName, familyId } = await seedKeeperSession();
        await ctx.addCookies([
          { name: sessionCookieName, value: sid, url: base, httpOnly: true, sameSite: 'Lax' },
          {
            name: 'cl_did',
            value: 'e2e-device-id-0001',
            url: base,
            httpOnly: true,
            sameSite: 'Lax',
          },
        ]);
        return familyId;
      },
      path: null,
    },
    {
      name: '47b-join-requests',
      async prepare(ctx) {
        const { sid, sessionCookieName, familyId } = await seedKeeperSession();
        await ctx.addCookies([
          { name: sessionCookieName, value: sid, url: base, httpOnly: true, sameSite: 'Lax' },
          {
            name: 'cl_did',
            value: 'e2e-device-id-0001',
            url: base,
            httpOnly: true,
            sameSite: 'Lax',
          },
        ]);
        return familyId;
      },
      path: null,
    },
  ];

  for (const shot of shots) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    let visitPath = shot.path;
    if (shot.prepare) {
      const extra = await shot.prepare(context);
      if (shot.name.startsWith('47')) {
        visitPath = `/families/${extra}/join/qr`;
        if (shot.name.startsWith('47b')) {
          visitPath = `/families/${extra}/join-requests`;
        }
      }
    }
    const page = await context.newPage();
    await page.goto(`${base}${visitPath}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outDir, `${shot.name}.png`), fullPage: true });
    await context.close();
  }

  await browser.close();
  next.kill('SIGTERM');
  mock.kill('SIGTERM');
  process.stdout.write(JSON.stringify({ outDir, count: shots.length }) + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
