import { VerifyPhoneForm } from '@/components/carelink/VerifyPhoneForm';
import { maskRuPhoneE164 } from '@/lib/phone';
import { requireSignInFlow } from '@/server/flows/signin-flow';

export default async function VerifyPhonePage() {
  const { flow } = await requireSignInFlow('verify-phone');
  const initialPhoneMasked = flow.phoneE164 ? maskRuPhoneE164(flow.phoneE164) : undefined;
  const otpAlreadySent = Boolean(flow.smsSentAt && flow.phoneE164);

  return (
    <VerifyPhoneForm
      initialPhoneMasked={initialPhoneMasked}
      otpAlreadySent={otpAlreadySent}
      workspaceEmail={flow.workspaceEmail}
    />
  );
}
