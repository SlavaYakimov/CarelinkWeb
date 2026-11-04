import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Помощь',
};

export default function HelpPage() {
  return (
    <article className="mx-auto w-full max-w-2xl py-4">
      <h1 className="text-2xl font-semibold tracking-tight">Помощь</h1>
      <section className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="text-base font-semibold text-foreground">Как войти в семью</h2>
          <p className="mt-1">
            Используйте адрес семьи (латиница) и пароль, которые вы задали при создании семьи или
            получили от хранителя. Личная почта нужна только на этапе регистрации новой семьи.
          </p>
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Как присоединиться к семье</h2>
          <p className="mt-1">
            Попросите хранителя отправить приглашение из мобильного приложения Carelink. Перейдите
            по ссылке из SMS или мессенджера и следуйте инструкции.
          </p>
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Забыли пароль</h2>
          <p className="mt-1">
            На экране входа выберите восстановление через семью — хранитель подтвердит запрос.
          </p>
        </div>
      </section>
      <p className="mt-8 text-sm">
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center text-primary hover:underline"
        >
          Вернуться ко входу
        </Link>
      </p>
    </article>
  );
}
