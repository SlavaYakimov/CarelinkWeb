import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalDraftNotice } from '@/components/carelink/LegalDraftNotice';

export const metadata: Metadata = {
  title: 'Условия использования',
};

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-2xl py-4">
      <LegalDraftNotice />
      <h1 className="text-2xl font-semibold tracking-tight">Условия использования Carelink</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Carelink — закрытый сервис для семейного круга. Используя веб-приложение, вы подтверждаете,
        что действуете от своего имени или с согласия законного представителя участника семьи.
      </p>
      <section className="mt-6 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Ответственность участников</h2>
        <p className="text-muted-foreground">
          Хранители семьи управляют составом круга и доступом. Не передавайте пароль и коды
          подтверждения третьим лицам. Сервис не заменяет экстренную медицинскую помощь.
        </p>
        <h2 className="text-lg font-semibold">Ограничения</h2>
        <p className="text-muted-foreground">
          Запрещено использовать Carelink для спама, несанкционированного сбора данных или обхода
          технических ограничений безопасности.
        </p>
      </section>
      <p className="mt-8 text-sm">
        <Link
          href="/privacy"
          className="inline-flex min-h-11 items-center text-primary hover:underline"
        >
          Политика конфиденциальности
        </Link>
      </p>
    </article>
  );
}
