import * as React from 'react';
import Link from 'next/link';
import { BellRing, Globe, Heart, Phone, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PublicAuthLayoutProps = {
  children: React.ReactNode;
  showTopNav?: boolean;
  gatewayBadge?: boolean;
};

export function PublicAuthLayout({
  children,
  showTopNav = false,
  gatewayBadge = true,
}: PublicAuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showTopNav ? (
        <header className="border-b border-border bg-card/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
            <BrandMark />
            <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
              <Link href="/login" className="hover:text-foreground">
                О сервисе
              </Link>
              <Link href="/login" className="hover:text-foreground">
                Безопасность
              </Link>
              <Link href="/login" className="hover:text-foreground">
                Помощь
              </Link>
            </nav>
            <Link
              href="/login"
              className="rounded-full border border-border px-4 py-1.5 text-sm font-medium"
            >
              Войти
            </Link>
          </div>
        </header>
      ) : null}

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-8 lg:py-10">
        <aside className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <BrandMark />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Heart className="size-3.5 text-secondary" aria-hidden />
              Семейный круг
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Забота, которой можно доверить близких
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Единое защищённое пространство для связи, напоминаний и поддержки старших
              родственников — только для вашей семьи.
            </p>
          </div>

          <div
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-accent via-muted to-background shadow-card"
            aria-hidden
          >
            <div className="absolute inset-0 flex items-end justify-center p-6">
              <p className="rounded-lg bg-card/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">
                Иллюстрация семьи — см. макет Stitch
              </p>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-1">
            <FeatureCard icon={Phone} text="Связь с родителями в один клик без сложных настроек" />
            <FeatureCard
              icon={BellRing}
              text="Уведомления о приёме лекарств и состоянии здоровья"
            />
            <FeatureCard
              icon={Shield}
              text="Закрытый контур только для ваших родных — без рекламы и сторонних трекеров"
            />
          </ul>

          <p className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="size-3.5 shrink-0" aria-hidden />
            Шифрование при передаче и хранении · Серверы под контролем команды Carelink
          </p>
        </aside>

        <section className="flex flex-col">
          {gatewayBadge ? (
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-success" aria-hidden />
                Шлюз авторизации семейных сетей
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono">v2.4</span>
            </div>
          ) : null}
          <div className="flex flex-1 flex-col justify-center">{children}</div>
          <AuthFooter className="mt-8" />
        </section>
      </div>

      {showTopNav ? (
        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Carelink. Спокойная забота о семье. Все права защищены.
        </footer>
      ) : null}
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <span className="text-lg font-semibold" aria-hidden>
          ⌂
        </span>
      </div>
      <div>
        <p className="font-heading text-lg font-semibold leading-tight text-primary">Carelink</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-secondary">
          Спокойная забота
        </p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-card">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="text-sm leading-snug text-foreground">{text}</p>
    </li>
  );
}

function AuthFooter({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground',
        className,
      )}
    >
      <Link href="/login" className="hover:text-foreground">
        Конфиденциальность
      </Link>
      <span aria-hidden>·</span>
      <Link href="/login" className="hover:text-foreground">
        Помощь
      </Link>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Globe className="size-3.5" aria-hidden />
        RU
      </span>
    </div>
  );
}
