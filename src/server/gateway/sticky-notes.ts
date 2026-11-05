import 'server-only';
import { gatewayFetch, type GatewayRequestContext } from '@/server/gateway/client';
import type { components } from '@/server/gateway/types.gen';

type SessionCtx = GatewayRequestContext & {
  sid: string;
  session: NonNullable<GatewayRequestContext['session']>;
  familyId: string;
};

type CreateBody = components['schemas']['CreateStickyNoteRequest'];
type StickyNote = components['schemas']['StickyNote'];
type ListResponse = components['schemas']['StickyNoteListResponse'];
type WidgetResponse = components['schemas']['StickyNoteWidgetResponse'];

function familyPath(familyId: string, suffix: string): string {
  return `/v1/families/${familyId}${suffix}`;
}

export async function createStickyNote(body: CreateBody, ctx: SessionCtx): Promise<StickyNote> {
  return gatewayFetch<StickyNote>(
    { method: 'POST', path: familyPath(ctx.familyId, '/sticky-notes'), body },
    ctx,
  );
}

export async function listStickyNotes(
  ctx: SessionCtx,
  query: { limit?: number; cursor?: string } = {},
): Promise<ListResponse> {
  const params = new URLSearchParams();
  if (query.limit != null) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);
  const qs = params.toString();
  const path = qs
    ? `${familyPath(ctx.familyId, '/sticky-notes')}?${qs}`
    : familyPath(ctx.familyId, '/sticky-notes');
  return gatewayFetch<ListResponse>({ method: 'GET', path }, ctx);
}

export async function getStickyNoteWidget(ctx: SessionCtx): Promise<WidgetResponse> {
  return gatewayFetch<WidgetResponse>(
    { method: 'GET', path: familyPath(ctx.familyId, '/sticky-notes/widget') },
    ctx,
  );
}

export async function markStickyNoteRead(ctx: SessionCtx, noteId: string): Promise<StickyNote> {
  return gatewayFetch<StickyNote>(
    { method: 'PATCH', path: familyPath(ctx.familyId, `/sticky-notes/${noteId}/read`) },
    ctx,
  );
}

export async function deleteStickyNote(ctx: SessionCtx, noteId: string): Promise<void> {
  await gatewayFetch<void>(
    { method: 'DELETE', path: familyPath(ctx.familyId, `/sticky-notes/${noteId}`) },
    ctx,
  );
}
