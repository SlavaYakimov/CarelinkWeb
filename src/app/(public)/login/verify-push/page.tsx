import { redirect } from 'next/navigation';
import { persistSignInFlow, requireSignInFlow } from '@/server/flows/signin-flow';

/** Legacy push URL — web uses SMS until BE-04 (PLAN.md). */
export default async function VerifyPushPage() {
  const { fid, flow } = await requireSignInFlow('verify-push');
  await persistSignInFlow(fid, { ...flow, step: 'verify-sms' });
  redirect('/login/verify-sms');
}
