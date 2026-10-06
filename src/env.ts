import { z } from 'zod';

const durationSchema = z.string().regex(/^\d+[smhdw]$/, 'Expected duration like 7d, 15m, 12h');

const base64Key32Schema = z
  .string()
  .min(1)
  .refine((v) => {
    try {
      const buf = Buffer.from(v, 'base64');
      return buf.length === 32;
    } catch {
      return false;
    }
  }, 'Must be 32 bytes encoded as base64');

const envSchema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']),
  APP_ORIGIN: z.string().url(),
  GATEWAY_URL: z.string().url(),
  GATEWAY_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  REDIS_URL: z.string().min(1),
  SESSION_ENC_KEY: base64Key32Schema,
  SESSION_ENC_KEY_PREVIOUS: base64Key32Schema.optional(),
  SESSION_IDLE_TTL: durationSchema.default('7d'),
  SESSION_ABSOLUTE_TTL: durationSchema.default('30d'),
  SESSION_GUEST_TTL: durationSchema.default('12h'),
  FLOW_TTL: durationSchema.default('15m'),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  COOKIE_PREFIX: z.string().default('__Host-'),
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  E2E_SERVICE_TOKEN: z.string().optional(),
  E2E_COMPOSE_PROJECT: z.string().optional(),
  CONTRACTS_SYNC_URL: z.string().url().optional(),
  GITHUB_TOKEN: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | undefined;

/** @internal test helper */
export function resetEnvCacheForTests(): void {
  cached = undefined;
}

/** Validated environment; throws at first access if misconfigured. */
export function getEnv(): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment:\n${lines.join('\n')}`);
  }
  cached = parsed.data;
  return cached;
}

/** Cookie name prefix + logical name (dev may use empty __Host- prefix). */
export function cookieName(logical: 'cl_sid' | 'cl_flow' | 'cl_did'): string {
  const { COOKIE_PREFIX } = getEnv();
  return `${COOKIE_PREFIX}${logical}`;
}
