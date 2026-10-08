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
import { usePhoneField } from '@/components/carelink/use-phone-field';
import { useResendCountdown } from '@/components/carelink/use-resend-countdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const phoneInitial: VerifySmsPhoneState = {};
const otpInitial: VerifySmsOtpState = {};

export type VerifySmsFormProps = {
  nextPath: string;
  initialPhoneMasked?: string;
  smsAlreadySent?: boolean;
  bannerMessage?: string;
};

export function VerifySmsForm({
  nextPath,
  initialPhoneMasked,
  smsAlreadySent = false,
  bannerMessage,
}: VerifySmsFormProps) {
  const [phoneState, sendSms, sending] = useActionState(sendSignInSmsAction, phoneInitial);
  const [otpState, confirmOtp, confirming] = useActionState(confirmSignInSmsAction, otpInitial);
  const [, resendSms, resending] = useActionState(
    async () => resendSignInSmsAction(),
    phoneInitial,
  );
  const phone = usePhoneField();
  const [code, setCode] = React.useState('');
  const resend = useResendCountdown({ startOnMount: smsAlreadySent, trigger: phoneState.smsSent });

  const smsSent = smsAlreadySent || phoneState.smsSent;
  const phoneMasked = phoneState.phoneMasked ?? initialPhoneMasked;

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
        {bannerMessage ? (
          <p className="rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm text-foreground">
            {bannerMessage}
          </p>
        ) : null}
        {!smsSent ? (
          <form action={sendSms} className="space-y-4">
            <PhoneInput
              value={phone.display}
              onChange={phone.onChange}
              disabled={sending}
              error={phoneState.error}
            />
            <input type="hidden" name="phone" value={phone.submitValue} />
            <Button type="submit" className="w-full" disabled={sending}>
              Отправить код
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={confirming || code.length < 6}>
                Подтвердить
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </form>
            <div className="text-center text-sm text-muted-foreground">
              {resend.secondsLeft > 0 ? (
                <span>Отправить код повторно через {resend.label}</span>
              ) : (
                <form action={resendSms} className="inline">
                  <button
                    type="submit"
                    className="text-primary underline-offset-2 hover:underline"
                    disabled={resending}
                    onClick={resend.restart}
                  >
                    Отправить код повторно
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
