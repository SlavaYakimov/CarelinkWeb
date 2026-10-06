import { VerifySmsForm } from '@/components/carelink/VerifySmsForm';
import { maskRuPhoneE164 } from '@/lib/phone';
import { requireSignInFlow } from '@/server/flows/signin-flow';
import { sanitizeNextParam } from '@/server/security/next-param';

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function VerifySmsPage({ searchParams }: PageProps) {
  const { flow } = await requireSignInFlow('verify-sms');
  const params = await searchParams;
  const nextPath = sanitizeNextParam(params.next);

  const initialPhoneMasked = flow.phoneE164 ? maskRuPhoneE164(flow.phoneE164) : undefined;
  const smsAlreadySent = Boolean(flow.smsSentAt && flow.phoneE164);

  return (
    <VerifySmsForm
      nextPath={nextPath}
      initialPhoneMasked={initialPhoneMasked}
      smsAlreadySent={smsAlreadySent}
    />
  );
}
