'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  confirmOnboardingPhoneOtpAction,
  resendOnboardingPhoneOtpAction,
  sendOnboardingPhoneOtpAction,
  type OnboardingPhoneOtpState,
  type OnboardingPhoneState,
} from '@/server/actions/onboarding';
import { OtpInput } from '@/components/carelink/OtpInput';
import { PhoneInput } from '@/components/carelink/PhoneInput';
import { ResendButton } from '@/components/carelink/ResendButton';
import { StepShell } from '@/components/carelink/StepShell';
import { onboardingPhoneClientSchema } from '@/lib/forms/schemas';
import { useFormGate } from '@/lib/forms/use-form-gate';
import { usePhoneField } from '@/components/carelink/use-phone-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const phoneInitial: OnboardingPhoneState = {};
const otpInitial: OnboardingPhoneOtpState = {};

export type OnboardingPhoneFormProps = {
  initialPhoneMasked?: string;
  smsAlreadySent?: boolean;
  initialSentAt?: string;
  defaultDisplayName?: string;
};

export function OnboardingPhoneForm({
  initialPhoneMasked,
  smsAlreadySent = false,
  initialSentAt,
  defaultDisplayName = '',
}: OnboardingPhoneFormProps) {
  const [phoneState, sendOtp, sending] = useActionState(sendOnboardingPhoneOtpAction, phoneInitial);
  const [otpState, confirmOtp, confirming] = useActionState(
    confirmOnboardingPhoneOtpAction,
    otpInitial,
  );
  const [resendState, resendOtp, resending] = useActionState(
    resendOnboardingPhoneOtpAction,
    phoneInitial,
  );
  const phone = usePhoneField();
  const [code, setCode] = React.useState('');
  const [displayName, setDisplayName] = React.useState(defaultDisplayName);

  const phoneGate = useFormGate(
    onboardingPhoneClientSchema,
    { phone: phone.submitValue, displayName },
    ['phone', 'displayName'],
    { pending: sending },
  );

  const smsSent = smsAlreadySent || phoneState.smsSent || resendState.smsSent;
  const phoneMasked = phoneState.phoneMasked ?? resendState.phoneMasked ?? initialPhoneMasked;
  const sentAt = phoneState.sentAt ?? resendState.sentAt ?? initialSentAt;

  return (
    <StepShell
      step={2}
      totalSteps={5}
      title="Телефон и имя"
      description="Номер нужен для входа и уведомлений. Имя увидят близкие в семье."
    >
      {!smsSent ? (
        <form action={sendOtp} className="space-y-4">
          {phoneState.error ? (
            <Alert variant="destructive">
              <AlertDescription>{phoneState.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="displayName">Как к вам обращаться</Label>
            <Input
              id="displayName"
              name="displayName"
              autoComplete="name"
              maxLength={64}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Мария"
              disabled={sending}
              required
            />
          </div>
          <PhoneInput
            value={phone.display}
            onChange={phone.onChange}
            disabled={sending}
            error={phoneState.error}
          />
          <input type="hidden" name="phone" value={phone.submitValue} />
          <Button type="submit" className="w-full" disabled={sending || !phoneGate.canSubmit}>
            Отправить SMS-код
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <form id="onboarding-phone-otp-form" action={confirmOtp} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {phoneMasked ? `Код отправлен на ${phoneMasked}.` : 'Введите код из SMS.'}
            </p>
            <div className="space-y-2">
              <Label id="phone-otp-label">Код из SMS</Label>
              <OtpInput
                id="phone-otp"
                labelledBy="phone-otp-label"
                name="code"
                formId="onboarding-phone-otp-form"
                length={6}
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
            action={resendOtp}
            pending={resending}
            successAt={sentAt}
            startOnMount={smsAlreadySent}
            retryAfter={resendState.retryAfter}
            error={resendState.error}
            onResendSuccess={() => setCode('')}
          />
        </div>
      )}
    </StepShell>
  );
}
