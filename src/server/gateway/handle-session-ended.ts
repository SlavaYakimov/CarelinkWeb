import 'server-only';
import { redirect } from 'next/navigation';
import { SessionEndedError } from '@/server/session/session-ended';

/**
 * Maps SessionEndedError to /session-ended in RSC and Server Actions.
 * Route handlers should catch SessionEndedError and return NextResponse.redirect instead.
 */
export function rethrowOrRedirectSessionEnded(err: unknown): never {
  if (err instanceof SessionEndedError) {
    redirect('/session-ended');
  }
  throw err;
}
