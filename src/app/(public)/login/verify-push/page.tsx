import { redirect } from 'next/navigation';
import { requireSignInFlow } from '@/server/flows/signin-flow';

/** Web MVP uses SMS only; push path redirects back to login. */
export default async function VerifyPushPage() {
  await requireSignInFlow('verify-push');
  redirect('/login');
}
