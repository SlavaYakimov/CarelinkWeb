import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionEndedError } from '@/server/session/session-ended';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock('@/server/session/session-ended', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/session/session-ended')>();
  return {
    ...actual,
    destroyLocalSession: vi.fn(async () => undefined),
    redirectSessionEnded: vi.fn(async () => {
      throw new Error('redirect:/session-ended');
    }),
  };
});

describe('withSessionHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('withServerAction redirects on SessionEndedError', async () => {
    const { withServerAction } = await import('@/server/session/with-session-handler');
    const action = withServerAction(async () => {
      throw new SessionEndedError('sid-abc');
    });
    await expect(action()).rejects.toThrow('redirect:/session-ended');
  });

  it('withRouteHandler returns 401 JSON on SessionEndedError', async () => {
    const { withRouteHandler, SESSION_ENDED_CODE } =
      await import('@/server/session/with-session-handler');
    const handler = withRouteHandler(async () => {
      throw new SessionEndedError('sid-abc');
    });
    const res = await handler(new Request('http://localhost/api/test'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ code: SESSION_ENDED_CODE });
  });
});
