import { redirect } from 'next/navigation';
import { RecoveryConfirmForm } from '@/components/carelink/RecoveryConfirmForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { readRecoveryFlow } from '@/server/flows/recovery-flow';
import { maskRuPhoneE164 } from '@/lib/phone';

export default async function RecoveryConfirmPage() {
  const ctx = await readRecoveryFlow();
  if (!ctx || ctx.flow.step !== 'sent') {
    redirect('/login/recovery');
  }

  const phoneMasked = ctx.flow.phoneE164 ? maskRuPhoneE164(ctx.flow.phoneE164) : undefined;

  return (
    <Card className="mx-auto w-full max-w-[440px] shadow-card">
      <CardHeader>
        <CardTitle className="text-2xl">Новый пароль</CardTitle>
        <CardDescription>
          Введите код из SMS и задайте новый пароль после одобрения хранителем.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RecoveryConfirmForm phoneMasked={phoneMasked} />
      </CardContent>
    </Card>
  );
}
