'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  confirmOnboardingDeviceSmsAction,
  sendOnboardingDeviceSmsAction,
  type OnboardingDeviceOtpState,
  type OnboardingDeviceState,
} from '@/server/actions/onboarding';
import { OtpInput } from '@/components/carelink/OtpInput';
import { StepShell } from '@/components/carelink/StepShell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const deviceInitial: OnboardingDeviceState = {};
const otpInitial: OnboardingDeviceOtpState = {};

export type OnboardingDeviceFormProps = {
  smsAlreadySent?: boolean;
};

export function OnboardingDeviceForm({ smsAlreadySent = false }: OnboardingDeviceFormProps) {
  const [deviceState, sendSms, sending] = useActionState(
    sendOnboardingDeviceSmsAction,
    deviceInitial,
  );
  const [otpState, confirmOtp, confirming] = useActionState(
    confirmOnboardingDeviceSmsAction,
    otpInitial,
  );
  const [code, setCode] = React.useState('');

  const smsSent = smsAlreadySent || deviceState.smsSent;

  return (
    <StepShell
      step={3}
      totalSteps={5}
      title="Подтверждение устройства"
      description="На этом шаге подтверждаем браузер по SMS. Push-уведомления в вебе пока недоступны — используем код."
    >
      {!smsSent ? (
        <div className="space-y-4">
          {deviceState.error ? (
            <Alert variant="destructive">
              <AlertDescription>{deviceState.error}</AlertDescription>
            </Alert>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Мы не регистрируем Web Push в браузере: backend принимает platform ios/android. Отправим
            SMS на номер с предыдущего шага.
          </p>
          <form action={sendSms}>
            <Button type="submit" className="w-full" disabled={sending}>
              Получить SMS-код
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-2">
          <form action={confirmOtp} className="space-y-4">
            {otpState.error ? (
              <Alert variant="destructive">
                <AlertDescription>{otpState.error}</AlertDescription>
              </Alert>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Введите код из SMS, чтобы доверить это устройство.
            </p>
            <div className="space-y-2">
              <Label>Код из SMS</Label>
              <input type="hidden" name="code" value={code} />
              <OtpInput length={6} value={code} onChange={setCode} disabled={confirming} />
            </div>
            <Button type="submit" className="w-full" disabled={confirming || code.length < 6}>
              Продолжить
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </form>
          <form action={sendSms}>
            <Button type="submit" variant="ghost" className="w-full" disabled={sending}>
              Отправить код повторно
            </Button>
          </form>
        </div>
      )}
    </StepShell>
  );
}
