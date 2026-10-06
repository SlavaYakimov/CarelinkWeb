import 'server-only';
import { getEnv } from '@/env';

export class CsrfError extends Error {
  constructor(message = 'CSRF validation failed') {
    super(message);
    this.name = 'CsrfError';
  }
}

/**
 * Origin / Sec-Fetch-Site checks for Route Handlers (§1.7).
 * Server Actions rely on Next.js built-in Origin checks.
 */
export function assertRouteHandlerCsrf(headers: Headers): void {
  const env = getEnv();
  const origin = headers.get('origin');
  const secFetchSite = headers.get('sec-fetch-site');

  if (secFetchSite === 'cross-site') {
    throw new CsrfError('cross-site request blocked');
  }

  if (origin && origin !== env.APP_ORIGIN) {
    throw new CsrfError('origin mismatch');
  }

  if (!origin && secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'same-site') {
    throw new CsrfError('missing trusted fetch site');
  }
}
