import 'server-only';
import { unstable_rethrow } from 'next/navigation';

/** Call first in server-action catch blocks so redirect()/notFound() from the try body propagate. */
export function rethrowNextNavigation(err: unknown): void {
  unstable_rethrow(err);
}
