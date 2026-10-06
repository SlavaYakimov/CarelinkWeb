'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  confirmSignInSmsAction,
  resendSignInSmsAction,
  sendSignInSmsAction,
  type VerifySmsOtpState,
  type VerifySmsPhoneState,
} from '@/server/actions/verify-sms';
import { OtpInput } from '@/components/carelink/OtpInput';
import { PhoneInput } from '@/components/carelink/PhoneInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const phoneInitial: VerifySmsPhoneState = {};
const otpInitial: VerifySmsOtpState = {};

export type VerifySmsFormProps = {
  nextPath: string;
  initialPhoneMasked?: string;
  smsAlreadySent?: boolean;
};

export function VerifySmsForm({
  nextPath,
  initialPhoneMasked,
  smsAlreadySent = false,
}: VerifySmsFormProps) {
  const [phoneState, sendSms, sending] = useActionState(sendSignInSmsAction, phoneInitial);
  const [otpState, confirmOtp, confirming] = useActionState(confirmSignInSmsAction, otpInitial);
  const [, resendSms, resending] = useActionState(
    async (prev: VerifySmsPhoneState) => resendSignInSmsAction(),
    phoneInitial,
  );
  const [phoneDisplay, setPhoneDisplay] = React.useState('');
  const [phoneE164, setPhoneE164] = React.useState('');
  const [code, setCode] = React.useState('');
  const [resendIn, setResendIn] = React.useState(smsAlreadySent ? 60 : 0);

  const smsSent = smsAlreadySent || phoneState.smsSent;
  const phoneMasked = phoneState.phoneMasked ?? initialPhoneMasked;

  React.useEffect(() => {
    if (phoneState.smsSent) setResendIn(60);
  }, [phoneState.smsSent]);

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);

  return (
    <Card className="mx-auto w-full max-w-[440px] shadow-card">
      <CardHeader>
        <CardTitle className="text-2xl">Введите код из SMS</CardTitle>
        <CardDescription>
          {phoneMasked
            ? `Код отправлен на ${phoneMasked}. Действует около 5 минут.`
            : 'Номер должен совпадать с тем, что указал хранитель при приглашении.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!smsSent ? (
          <form action={sendSms} className="space-y-4">
            <PhoneInput
              value={phoneDisplay}
              onChange={(display, e164) => {
                setPhoneDisplay(display);
                setPhoneE164(e164 ?? '');
              }}
              disabled={sending}
              error={phoneState.error}
            />
            <input type="hidden" name="phone" value={phoneE164 || phoneDisplay} />
            <Button type="submit" className="w-full" disabled={sending}>
              Отправить код
            </Button>
          </form>
        ) : (
          <form action={confirmOtp} className="space-y-4">
            <input type="hidden" name="next" value={nextPath} />
            <input type="hidden" name="code" value={code} />
            <div>
              <p
                id="otp-label"
                className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Код из SMS
              </p>
              <OtpInput
                value={code}
                onChange={setCode}
                disabled={confirming}
                error={otpState.error}
              />
              {otpState.attemptsHint ? (
                <p className="mt-2 text-xs text-muted-foreground">{otpState.attemptsHint}</p>
              ) : null}
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {resendIn > 0 ? (
                <span>Отправить код повторно через {formatMmSs(resendIn)}</span>
              ) : (
                <form action={resendSms} className="inline">
                  <button
                    type="submit"
                    className="text-primary underline-offset-2 hover:underline"
                    disabled={resending}
                    onClick={() => setResendIn(60)}
                  >
                    Отправить код повторно
                  </button>
                </form>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={confirming || code.length < 6}>
              Подтвердить
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function formatMmSs(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
