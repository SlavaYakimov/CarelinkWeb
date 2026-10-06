import { describe, it, expect } from 'vitest';
import { isSessionEndedResponse } from '@/lib/session-ended-fetch';
import { SESSION_ENDED_CODE } from '@/lib/session-ended';

describe('isSessionEndedResponse', () => {
  it('detects 401 SESSION_ENDED JSON', async () => {
    const res = new Response(JSON.stringify({ code: SESSION_ENDED_CODE }), { status: 401 });
    expect(await isSessionEndedResponse(res)).toBe(true);
  });

  it('ignores other 401 bodies', async () => {
    const res = new Response(JSON.stringify({ error: 'NO_FLOW' }), { status: 401 });
    expect(await isSessionEndedResponse(res)).toBe(false);
  });
});
