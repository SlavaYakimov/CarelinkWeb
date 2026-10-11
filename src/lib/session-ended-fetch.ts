import { SESSION_ENDED_CODE } from '@/lib/session-ended';

export { SESSION_ENDED_CODE };

export function navigateToSessionEnded(): void {
  // Full navigation clears client state after session teardown (not an in-app route transition).
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional hard redirect
  window.location.assign('/session-ended');
}

/** Returns true when the response is our session-ended JSON (401). */
export async function isSessionEndedResponse(res: Response): Promise<boolean> {
  if (res.status !== 401) return false;
  try {
    const data = (await res.clone().json()) as { code?: string };
    return data.code === SESSION_ENDED_CODE;
  } catch {
    return false;
  }
}
