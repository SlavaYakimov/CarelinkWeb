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
import { ResendButton } from '@/components/carelink/ResendButton';
import { usePhoneField } from '@/components/carelink/use-phone-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const phoneInitial: VerifyPhoneState = {};
const otpInitial: VerifyPhoneOtpState = {};

export type VerifyPhoneFormProps = {
  initialPhoneMasked?: string;
  otpAlreadySent?: boolean;
  initialSentAt?: string;
  workspaceEmail?: string;
};

export function VerifyPhoneForm({
  initialPhoneMasked,
  otpAlreadySent = false,
  initialSentAt,
  workspaceEmail,
}: VerifyPhoneFormProps) {
  const [phoneState, sendOtp, sending] = useActionState(sendSignInPhoneOtpAction, phoneInitial);
  const [otpState, confirmOtp, confirming] = useActionState(
    confirmSignInPhoneOtpAction,
    otpInitial,
  );
  const [resendState, resendOtp, resending] = useActionState(
    resendSignInPhoneOtpAction,
    phoneInitial,
  );
  const phone = usePhoneField();
  const [code, setCode] = React.useState('');

  const otpSent = otpAlreadySent || phoneState.otpSent || resendState.otpSent;
  const phoneMasked = phoneState.phoneMasked ?? resendState.phoneMasked ?? initialPhoneMasked;
  const sentAt = phoneState.sentAt ?? resendState.sentAt ?? initialSentAt;

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
              value={phone.display}
              onChange={phone.onChange}
              disabled={sending}
              error={phoneState.error}
            />
            <input type="hidden" name="phone" value={phone.submitValue} />
            <Button type="submit" className="w-full" disabled={sending || !phone.e164}>
              Отправить код
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <form id="verify-phone-otp-form" action={confirmOtp} className="space-y-4">
              {otpState.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{otpState.error}</AlertDescription>
                </Alert>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {phoneMasked ? `Код из SMS отправлен на ${phoneMasked}.` : 'Введите 6-значный код.'}
              </p>
              <OtpInput
                id="verify-phone-otp"
                labelText="Код из SMS"
                name="code"
                formId="verify-phone-otp-form"
                value={code}
                onChange={setCode}
                disabled={confirming}
                error={otpState.error}
                attemptsHint={otpState.attemptsHint}
              />
              <Button type="submit" className="w-full" disabled={confirming || code.length < 6}>
                Продолжить
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </form>
            <ResendButton
              action={resendOtp}
              pending={resending}
              successAt={sentAt}
              startOnMount={otpAlreadySent}
              retryAfter={resendState.retryAfter}
              error={resendState.error}
              onResendSuccess={() => setCode('')}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
