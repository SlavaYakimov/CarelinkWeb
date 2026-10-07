'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { OtpInput } from '@/components/carelink/OtpInput';
import { PasswordField } from '@/components/carelink/PasswordField';
import { PhoneInput } from '@/components/carelink/PhoneInput';
import { StepShell } from '@/components/carelink/StepShell';
import { WorkspaceSlugField } from '@/components/carelink/WorkspaceSlugField';
import { ErrorScreen } from '@/components/carelink/ErrorScreen';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/messages';

export function DevKitShowcase() {
  const [otp, setOtp] = React.useState('');
  const [phone, setPhone] = React.useState('+7');
  const [password, setPassword] = React.useState('');

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-8 pb-20">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Carelink / dev</p>
        <h1 className="text-3xl font-semibold">Design kit</h1>
        <p className="text-muted-foreground">
          Токены из DESIGN.md, компоненты shadcn и Carelink. Только development.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Swatch label="Primary" className="bg-primary text-primary-foreground" hex="#1F5C4A" />
        <Swatch
          label="Accent container"
          className="bg-accent text-accent-foreground"
          hex="#DCEFE6"
        />
        <Swatch
          label="Secondary"
          className="bg-secondary text-secondary-foreground"
          hex="#8A6A3B"
        />
        <Swatch
          label="Warning"
          className="bg-warning-muted text-warning-foreground"
          hex="#FFF4E0"
        />
      </section>

      <Section title="Button">
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Input & Label">
        <div className="grid max-w-md gap-4">
          <WorkspaceSlugField
            id="demo-workspace-slug"
            name="demoWorkspaceSlug"
            label="Адрес семьи (латиница)"
          />
          <Input aria-invalid placeholder="Ошибка" defaultValue="неверное значение" />
          <Input disabled placeholder="Disabled" />
        </div>
      </Section>

      <Section title="Alert">
        <div className="grid gap-3">
          <Alert variant="info">
            <AlertTitle>Подсказка</AlertTitle>
            <AlertDescription>Данные семьи доступны только участникам.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Внимание</AlertTitle>
            <AlertDescription>Проверьте номер телефона перед отправкой кода.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{getErrorMessage('INVALID_CREDENTIALS')}</AlertDescription>
          </Alert>
        </div>
      </Section>

      <Section title="Checkbox & Dialog">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked id="trust-device" />
            Доверять этому устройству
          </label>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Открыть dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Пример диалога</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Контент модального окна.</p>
            </DialogContent>
          </Dialog>
          <Button variant="secondary" onClick={() => toast('Сохранено')}>
            Toast
          </Button>
        </div>
      </Section>

      <Section title="Carelink — PhoneInput">
        <PhoneInput
          value={phone}
          onChange={(display) => setPhone(display)}
          hint="Маска +7, нормализация на сервере"
        />
      </Section>

      <Section title="Carelink — OtpInput">
        <OtpInput
          value={otp}
          onChange={setOtp}
          error={otp.length > 0 && otp.length < 6 ? 'Введите 6 цифр' : undefined}
        />
      </Section>

      <Section title="Carelink — PasswordField">
        <PasswordField value={password} onChange={setPassword} />
      </Section>

      <Section title="Carelink — StepShell">
        <StepShell
          title="Подтверждение телефона"
          description="Мы отправим SMS-код"
          step={2}
          totalSteps={5}
          onBack={() => undefined}
        >
          <Card>
            <CardHeader>
              <CardTitle>Шаг формы</CardTitle>
              <CardDescription>Контент шага сценария</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Продолжить</Button>
            </CardContent>
          </Card>
        </StepShell>
      </Section>

      <Section title="Carelink — ErrorScreen">
        <div className="grid gap-8 lg:grid-cols-2">
          <ErrorScreen code="INVALID_CREDENTIALS" />
          <ErrorScreen
            variant="rate-limit"
            code="RATE_LIMIT"
            retryAfterSeconds={299}
            primaryAction={{ label: 'Войти снова', disabled: true, onClick: () => undefined }}
            secondaryAction={{ label: 'Восстановить через семью', onClick: () => undefined }}
          />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ label, hex, className }: { label: string; hex: string; className: string }) {
  return (
    <div className={`rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-card)] ${className}`}>
      <p className="font-medium">{label}</p>
      <p className="text-sm opacity-90">{hex}</p>
    </div>
  );
}
