'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  requestOnboardingEmailAction,
  verifyOnboardingEmailAction,
  type OnboardingEmailOtpState,
  type OnboardingEmailState,
} from '@/server/actions/onboarding';
import { OtpInput } from '@/components/carelink/OtpInput';
import { StepShell } from '@/components/carelink/StepShell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const emailInitial: OnboardingEmailState = {};
const otpInitial: OnboardingEmailOtpState = {};

export type OnboardingEmailFormProps = {
  linkInvalid?: boolean;
};

export function OnboardingEmailForm({ linkInvalid }: OnboardingEmailFormProps) {
  const [emailState, requestEmail, requesting] = useActionState(
    requestOnboardingEmailAction,
    emailInitial,
  );
  const [otpState, verifyEmail, verifying] = useActionState(
    verifyOnboardingEmailAction,
    otpInitial,
  );
  const [code, setCode] = React.useState('');
  const sent = emailState.sent;
  const email = emailState.email ?? '';

  return (
    <StepShell
      step={1}
      totalSteps={5}
      title="Личная почта"
      description="Укажите почту, на которую придёт код или ссылка для подтверждения. Она не станет логином семьи."
    >
      {linkInvalid ? (
        <Alert variant="destructive">
          <AlertDescription>
            Ссылка из письма недействительна или устарела. Запросите код заново.
          </AlertDescription>
        </Alert>
      ) : null}

      {!sent ? (
        <form action={requestEmail} className="space-y-4">
          {emailState.error ? (
            <Alert variant="destructive">
              <AlertDescription>{emailState.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Личная почта</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              defaultValue={email}
              disabled={requesting}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={requesting}>
            Отправить код
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      ) : (
        <form action={verifyEmail} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          {otpState.error ? (
            <Alert variant="destructive">
              <AlertDescription>{otpState.error}</AlertDescription>
            </Alert>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Код отправлен на {email}. Можно ввести 6 цифр или перейти по ссылке из письма.
          </p>
          <div className="space-y-2">
            <Label id="email-otp-label" htmlFor="email-otp">
              Код из письма
            </Label>
            <input type="hidden" name="code" value={code} />
            <OtpInput
              id="email-otp"
              length={6}
              value={code}
              onChange={setCode}
              disabled={verifying}
            />
          </div>
          <Button type="submit" className="w-full" disabled={verifying || code.length < 6}>
            Продолжить
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      )}
    </StepShell>
  );
}
