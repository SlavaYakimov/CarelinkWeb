import 'server-only';
import { redirect } from 'next/navigation';
import {
  delegateUnavailablePath,
  mapDelegateGatewayError,
  type DelegateUnavailableReason,
} from '@/lib/delegate-errors';
import { GatewayError } from '@/server/gateway/errors';

export function redirectDelegateUnavailable(reason: DelegateUnavailableReason): never {
  redirect(delegateUnavailablePath(reason));
}

/** Redirects or rethrows when delegate token API fails with a known outcome. */
export function handleDelegateGatewayError(err: unknown): never {
  if (!(err instanceof GatewayError)) throw err;

  const mapped = mapDelegateGatewayError(err);
  if (mapped === 'forbidden') redirect('/forbidden');
  if (mapped === 'login') redirect('/login?next=%2Fdelegate');
  if (mapped) redirectDelegateUnavailable(mapped);

  throw err;
}
