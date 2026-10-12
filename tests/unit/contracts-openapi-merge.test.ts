import { describe, it, expect } from 'vitest';
import { mergeOpenApiDocuments } from '../../scripts/contracts-openapi-utils.mjs';

describe('mergeOpenApiDocuments', () => {
  it('merges paths from auth and family without dropping either', () => {
    const auth = {
      openapi: '3.1.0',
      info: { title: 'Auth', version: '1.0.0' },
      paths: {
        '/auth/session/rebuild': { post: { operationId: 'rebuildAuthSession' } },
      },
      components: { schemas: { AuthSessionResponse: { type: 'object' } } },
    };
    const family = {
      openapi: '3.1.0',
      info: { title: 'Family', version: '1.0.0' },
      paths: {
        '/user/member-invites/pending': { get: { operationId: 'listPendingMemberInvites' } },
      },
      components: { schemas: { PendingMemberInviteListResponse: { type: 'object' } } },
    };

    const merged = mergeOpenApiDocuments(auth, family);
    expect(Object.keys(merged.paths).sort()).toEqual([
      '/auth/session/rebuild',
      '/user/member-invites/pending',
    ]);
    expect(merged.components.schemas).toMatchObject({
      AuthSessionResponse: { type: 'object' },
      PendingMemberInviteListResponse: { type: 'object' },
    });
  });
});
