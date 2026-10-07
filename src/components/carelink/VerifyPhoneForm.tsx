'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  confirmSignInPhoneOtpAction,
  resendSignInPhoneOtpAction,
  sendSignInPhoneOtpAction,
  type VerifyPhoneOtpState,
  type VerifyPhoneState,
} from '@/server/actions/verify-phone';
import { OtpInput } from '@/components/carelink/OtpInput';
import { PhoneInput } from '@/components/carelink/PhoneInput';
import { usePhoneField } from '@/components/carelink/use-phone-field';
import { useResendCountdown } from '@/components/carelink/use-resend-countdown';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const phoneInitial: VerifyPhoneState = {};
const otpInitial: VerifyPhoneOtpState = {};

export type VerifyPhoneFormProps = {
  initialPhoneMasked?: string;
  otpAlreadySent?: boolean;
  workspaceEmail?: string;
};

export function VerifyPhoneForm({
  initialPhoneMasked,
  otpAlreadySent = false,
  workspaceEmail,
}: VerifyPhoneFormProps) {
  const [phoneState, sendOtp, sending] = useActionState(sendSignInPhoneOtpAction, phoneInitial);
  const [otpState, confirmOtp, confirming] = useActionState(
    confirmSignInPhoneOtpAction,
    otpInitial,
  );
  const [, resendOtp, resending] = useActionState(resendSignInPhoneOtpAction, phoneInitial);
  const phone = usePhoneField();
  const [code, setCode] = React.useState('');
  const resend = useResendCountdown({ startOnMount: otpAlreadySent, trigger: phoneState.otpSent });

  const otpSent = otpAlreadySent || phoneState.otpSent;
  const phoneMasked = phoneState.phoneMasked ?? initialPhoneMasked;

  return (
    <Card className="mx-auto w-full max-w-[440px] shadow-card">
      <CardHeader>
        <CardTitle className="text-2xl">Подтверждение телефона</CardTitle>
        <CardDescription>
          {workspaceEmail
            ? `Для входа ${workspaceEmail} подтвердите номер, привязанный к семье.`
            : 'Подтвердите номер телефона, чтобы продолжить вход.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!otpSent ? (
          <form action={sendOtp} className="space-y-4">
            {phoneState.error ? (
              <Alert variant="destructive">
                <AlertDescription>{phoneState.error}</AlertDescription>
              </Alert>
            ) : null}
            <PhoneInput value={phone.display} onChange={phone.onChange} disabled={sending} />
            <input type="hidden" name="phone" value={phone.submitValue} />
            <Button type="submit" className="w-full" disabled={sending || !phone.e164}>
              Отправить код
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </form>
        ) : (
          <form action={confirmOtp} className="space-y-4">
            {otpState.error ? (
              <Alert variant="destructive">
                <AlertDescription>{otpState.error}</AlertDescription>
              </Alert>
            ) : null}
            {otpState.attemptsHint ? (
              <p className="text-xs text-muted-foreground">{otpState.attemptsHint}</p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {phoneMasked ? `Код из SMS отправлен на ${phoneMasked}.` : 'Введите 4-значный код.'}
            </p>
            <input type="hidden" name="code" value={code} />
            <OtpInput
              length={4}
              value={code}
              onChange={setCode}
              disabled={confirming}
              error={otpState.error}
            />
            <Button type="submit" className="w-full" disabled={confirming || code.length < 4}>
              Продолжить
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <form action={resendOtp}>
              <Button
                type="submit"
                variant="ghost"
                className="w-full"
                disabled={resending || resend.secondsLeft > 0}
              >
                {resend.secondsLeft > 0
                  ? `Отправить снова через ${resend.secondsLeft} с`
                  : 'Отправить код повторно'}
              </Button>
            </form>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
