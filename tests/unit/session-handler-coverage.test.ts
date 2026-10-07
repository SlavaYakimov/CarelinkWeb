import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = join(process.cwd(), 'src');

const ACTION_FILES = [
  'sign-in.ts',
  'change-password.ts',
  'verify-sms.ts',
  'keeper-wait.ts',
  'delegate-approval.ts',
  'logout.ts',
  'create-family.ts',
  'recovery.ts',
  'onboarding.ts',
  'verify-phone.ts',
];

const ROUTE_HANDLERS: Array<{ path: string; exempt?: boolean }> = [
  { path: 'app/api/auth/sign-in/delegate-status/route.ts' },
  { path: 'app/api/health/route.ts', exempt: true },
];

describe('session handler coverage', () => {
  it('every gateway server action module uses withServerAction', () => {
    for (const file of ACTION_FILES) {
      const src = readFileSync(join(ROOT, 'server/actions', file), 'utf8');
      expect(src, `${file} must import withServerAction`).toMatch(/withServerAction/);
      expect(src, `${file} must export wrapped handlers`).toMatch(
        /export const \w+ = withServerAction|withSessionTask/,
      );
      expect(src, `${file} must not export raw async handlers`).not.toMatch(
        /export async function \w+Action/,
      );
    }
  });

  it('session-aware API routes use withRouteHandler', () => {
    for (const { path, exempt } of ROUTE_HANDLERS) {
      const src = readFileSync(join(ROOT, path), 'utf8');
      if (exempt) continue;
      expect(src, path).toMatch(/withRouteHandler/);
      expect(src, path).not.toMatch(/export async function GET/);
    }
  });

  it('no extra unwrapped action modules under server/actions', () => {
    const files = readdirSync(join(ROOT, 'server/actions')).filter((f) => f.endsWith('.ts'));
    const allowed = new Set([...ACTION_FILES, 'request-context.ts']);
    for (const file of files) {
      expect(allowed.has(file), `add ${file} to session wrapper list or exempt`).toBe(true);
    }
  });
});
