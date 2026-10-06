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
  const [phoneDisplay, setPhoneDisplay] = React.useState('');
  const [phoneE164, setPhoneE164] = React.useState('');
  const [code, setCode] = React.useState('');
  const [resendIn, setResendIn] = React.useState(otpAlreadySent ? 60 : 0);

  const otpSent = otpAlreadySent || phoneState.otpSent;
  const phoneMasked = phoneState.phoneMasked ?? initialPhoneMasked;

  React.useEffect(() => {
    if (phoneState.otpSent) setResendIn(60);
  }, [phoneState.otpSent]);

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);

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
            <PhoneInput
              value={phoneDisplay}
              onChange={(display, e164) => {
                setPhoneDisplay(display);
                setPhoneE164(e164 ?? '');
              }}
              disabled={sending}
            />
            <input type="hidden" name="phone" value={phoneE164 || phoneDisplay} />
            <Button type="submit" className="w-full" disabled={sending || !phoneE164}>
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
                disabled={resending || resendIn > 0}
              >
                {resendIn > 0 ? `Отправить снова через ${resendIn} с` : 'Отправить код повторно'}
              </Button>
            </form>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
