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
import { ResendButton } from '@/components/carelink/ResendButton';
import { usePhoneField } from '@/components/carelink/use-phone-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const phoneInitial: VerifySmsPhoneState = {};
const otpInitial: VerifySmsOtpState = {};

export type VerifySmsFormProps = {
  nextPath: string;
  initialPhoneMasked?: string;
  smsAlreadySent?: boolean;
  initialSentAt?: string;
  bannerMessage?: string;
};

export function VerifySmsForm({
  nextPath,
  initialPhoneMasked,
  smsAlreadySent = false,
  initialSentAt,
  bannerMessage,
}: VerifySmsFormProps) {
  const [phoneState, sendSms, sending] = useActionState(sendSignInSmsAction, phoneInitial);
  const [otpState, confirmOtp, confirming] = useActionState(confirmSignInSmsAction, otpInitial);
  const [resendState, resendSms, resending] = useActionState(resendSignInSmsAction, phoneInitial);
  const phone = usePhoneField();
  const [code, setCode] = React.useState('');

  const smsSent = smsAlreadySent || phoneState.smsSent || resendState.smsSent;
  const phoneMasked = phoneState.phoneMasked ?? resendState.phoneMasked ?? initialPhoneMasked;
  const sentAt = phoneState.sentAt ?? resendState.sentAt ?? initialSentAt;
  const resendError = resendState.error;
  const retryAfter = resendState.retryAfter;

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
            <form id="verify-sms-otp-form" action={confirmOtp} className="space-y-4">
              <input type="hidden" name="next" value={nextPath} />
              <div>
                <p
                  id="otp-label"
                  className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  Код из SMS
                </p>
                <OtpInput
                  id="otp"
                  labelledBy="otp-label"
                  name="code"
                  formId="verify-sms-otp-form"
                  value={code}
                  onChange={setCode}
                  disabled={confirming}
                  error={otpState.error}
                  attemptsHint={otpState.attemptsHint}
                />
              </div>
              <Button type="submit" className="w-full" disabled={confirming || code.length < 6}>
                Подтвердить
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </form>
            <ResendButton
              action={resendSms}
              pending={resending}
              successAt={sentAt}
              startOnMount={smsAlreadySent}
              retryAfter={retryAfter}
              error={resendError}
              onResendSuccess={() => setCode('')}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
