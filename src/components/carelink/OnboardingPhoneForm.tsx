'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  confirmOnboardingPhoneOtpAction,
  sendOnboardingPhoneOtpAction,
  type OnboardingPhoneOtpState,
  type OnboardingPhoneState,
} from '@/server/actions/onboarding';
import { OtpInput } from '@/components/carelink/OtpInput';
import { PhoneInput } from '@/components/carelink/PhoneInput';
import { StepShell } from '@/components/carelink/StepShell';
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
  defaultDisplayName?: string;
};

export function OnboardingPhoneForm({
  initialPhoneMasked,
  smsAlreadySent = false,
  defaultDisplayName = '',
}: OnboardingPhoneFormProps) {
  const [phoneState, sendOtp, sending] = useActionState(sendOnboardingPhoneOtpAction, phoneInitial);
  const [otpState, confirmOtp, confirming] = useActionState(
    confirmOnboardingPhoneOtpAction,
    otpInitial,
  );
  const phone = usePhoneField();
  const [code, setCode] = React.useState('');
  const [displayName, setDisplayName] = React.useState(defaultDisplayName);

  const smsSent = smsAlreadySent || phoneState.smsSent;
  const phoneMasked = phoneState.phoneMasked ?? initialPhoneMasked;

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
            error={undefined}
          />
          <input type="hidden" name="phone" value={phone.submitValue} />
          <Button type="submit" className="w-full" disabled={sending || !phone.e164}>
            Отправить SMS-код
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
            {phoneMasked ? `Код отправлен на ${phoneMasked}.` : 'Введите код из SMS.'}
          </p>
          <div className="space-y-2">
            <Label id="phone-otp-label">Код из SMS</Label>
            <input type="hidden" name="code" value={code} />
            <OtpInput length={6} value={code} onChange={setCode} disabled={confirming} />
          </div>
          <Button type="submit" className="w-full" disabled={confirming || code.length < 6}>
            Подтвердить
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      )}
    </StepShell>
  );
}
