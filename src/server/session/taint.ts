import 'server-only';
import {
  experimental_taintObjectReference as taintObjectReference,
  experimental_taintUniqueValue as taintUniqueValue,
} from 'react';
import type { SessionRecord } from '@/server/session/types';

/** Prevent accidental leakage of secrets into client components. */
export function taintSessionSecrets(session: SessionRecord): void {
  taintUniqueValue('Carelink userRefresh must stay server-side', session, session.userRefresh);
  taintUniqueValue('Carelink deviceSession must stay server-side', session, session.deviceSession);
  taintObjectReference('Carelink family tokens must stay server-side', session.families);
  for (const familyId of Object.keys(session.families)) {
    const ft = session.families[familyId]!;
    taintUniqueValue('Carelink access token must stay server-side', ft, ft.access);
    taintUniqueValue('Carelink refresh token must stay server-side', ft, ft.refresh);
  }
}
