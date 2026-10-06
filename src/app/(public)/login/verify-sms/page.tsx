import { requireSignInFlow } from '@/server/flows/signin-flow';

/** Placeholder shell for W-05 — ensures flow cookie is valid before SMS step. */
export default async function VerifySmsPlaceholderPage() {
  await requireSignInFlow('verify-sms');

  return (
    <div className="mx-auto w-full max-w-[440px] rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
      Подтверждение устройства по SMS (экран 07) — задача W-05.
    </div>
  );
}
