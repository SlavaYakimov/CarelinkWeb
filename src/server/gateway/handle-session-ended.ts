import 'server-only';
import { handleSessionEndedForAction } from '@/server/session/with-session-handler';

/** Used by gatewayFetch when refresh rejects the session. */
export async function rethrowOrRedirectSessionEnded(err: unknown): Promise<never> {
  return handleSessionEndedForAction(err);
}
