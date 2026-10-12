'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';

import { createFamilyFormSchema } from '@/lib/forms/schemas';
import { zodFieldErrors } from '@/lib/forms/to-form-state';
import { gatewayActionContext } from '@/server/actions/request-context';
import { createFamily } from '@/server/gateway/families';
import { GatewayError } from '@/server/gateway/errors';
import { sessionRecordFromAuthResponse } from '@/server/session/from-auth-session';
import { getSession } from '@/server/session/get-session';
import { saveSession } from '@/server/session/store';
import { withServerAction } from '@/server/session/with-session-handler';

export type CreateFamilyFormState = {
  formError?: string;
  fieldErrors?: { name?: string };
};

async function createFamilyActionImpl(
  _prev: CreateFamilyFormState,
  formData: FormData,
): Promise<CreateFamilyFormState> {
  const parsed = createFamilyFormSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) {
    const flat = zodFieldErrors(parsed.error.flatten().fieldErrors);
    return { fieldErrors: flat.name ? { name: flat.name } : undefined };
  }

  const sessionCtx = await getSession();
  if (!sessionCtx) {
    redirect('/session-ended');
  }

  const { clientIp, deviceId } = await gatewayActionContext();

  try {
    const response = await createFamily(
      { name: parsed.data.name, unionRole: 'keeper' },
      {
        sid: sessionCtx.sid,
        session: sessionCtx.session,
        clientIp,
        deviceId,
        familyId: sessionCtx.session.activeFamilyId,
        idempotencyKey: randomUUID(),
      },
    );

    const patch = sessionRecordFromAuthResponse(response.session, {
      deviceSession: sessionCtx.session.deviceSession,
      guestMode: sessionCtx.session.guestMode,
    });

    const merged = {
      ...sessionCtx.session,
      ...patch,
      families: { ...sessionCtx.session.families, ...patch.families },
      activeFamilyId: response.id,
      lastSeenAt: new Date().toISOString(),
    };

    await saveSession(sessionCtx.sid, merged);
    redirect('/families');
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.code === 'RATE_LIMIT') {
        return { formError: 'Слишком много попыток. Попробуйте позже.' };
      }
      return { formError: 'Не удалось создать семью. Попробуйте позже.' };
    }
    throw err;
  }
}

export const createFamilyAction = withServerAction(createFamilyActionImpl);
