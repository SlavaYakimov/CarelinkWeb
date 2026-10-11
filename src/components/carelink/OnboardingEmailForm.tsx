'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  requestOnboardingEmailAction,
  resendOnboardingEmailAction,
  verifyOnboardingEmailAction,
  type OnboardingEmailOtpState,
  type OnboardingEmailState,
} from '@/server/actions/onboarding';
import { emailFormSchema } from '@/lib/forms/schemas';
import { useFormGate } from '@/lib/forms/use-form-gate';
import { OtpInput } from '@/components/carelink/OtpInput';
import { ResendButton } from '@/components/carelink/ResendButton';
import { StepShell } from '@/components/carelink/StepShell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const emailInitial: OnboardingEmailState = {};
const otpInitial: OnboardingEmailOtpState = {};

export type OnboardingEmailFormProps = {
  linkInvalid?: boolean;
  initialSentAt?: string;
};

export function OnboardingEmailForm({ linkInvalid, initialSentAt }: OnboardingEmailFormProps) {
  const [emailState, requestEmail, requesting] = useActionState(
    requestOnboardingEmailAction,
    emailInitial,
  );
  const [otpState, verifyEmail, verifying] = useActionState(
    verifyOnboardingEmailAction,
    otpInitial,
  );
  const [resendState, resendEmail, resending] = useActionState(
    resendOnboardingEmailAction,
    emailInitial,
  );
  const [code, setCode] = React.useState('');
  const [emailInput, setEmailInput] = React.useState('');
  const emailGate = useFormGate(
    emailFormSchema,
    { email: emailInput },
    ['email'],
    { pending: requesting },
  );
  const sent = emailState.sent || resendState.sent;
  const email = emailState.email ?? resendState.email ?? '';
  const sentAt = emailState.sentAt ?? resendState.sentAt ?? initialSentAt;

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
        <form action={requestEmail} className="space-y-4" noValidate>
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
              autoCapitalize="none"
              enterKeyHint="send"
              placeholder="you@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              disabled={requesting}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={requesting || !emailGate.canSubmit}>
            Отправить код
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <form id="onboarding-email-otp-form" action={verifyEmail} className="space-y-4">
            <input type="hidden" name="email" value={email} />
            <p className="text-sm text-muted-foreground">
              Код отправлен на {email}. Можно ввести 6 цифр или перейти по ссылке из письма.
            </p>
            <div className="space-y-2">
              <Label id="email-otp-label" htmlFor="email-otp">
                Код из письма
              </Label>
              <OtpInput
                id="email-otp"
                labelledBy="email-otp-label"
                name="code"
                formId="onboarding-email-otp-form"
                length={6}
                value={code}
                onChange={setCode}
                disabled={verifying}
                error={otpState.error ?? undefined}
              />
            </div>
            <Button type="submit" className="w-full" disabled={verifying || code.length < 6}>
              Продолжить
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </form>
          <ResendButton
            action={resendEmail}
            pending={resending}
            successAt={sentAt}
            startOnMount={Boolean(sent)}
            retryAfter={resendState.retryAfter}
            error={resendState.error}
            onResendSuccess={() => setCode('')}
          />
          <p className="text-center text-sm">
            <a href="/onboarding/email" className="text-primary hover:underline">
              Изменить почту
            </a>
          </p>
        </div>
      )}
    </StepShell>
  );
}
