import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalDraftNotice } from '@/components/carelink/LegalDraftNotice';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности',
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-2xl py-4">
      <LegalDraftNotice />
      <h1 className="text-2xl font-semibold tracking-tight">
        Политика конфиденциальности Carelink
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Carelink обрабатывает персональные данные участников семейных кругов в соответствии с
        Федеральным законом № 152-ФЗ «О персональных данных», включая сведения о здоровье и
        контактные данные, которые вы добровольно предоставляете при регистрации и использовании
        сервиса.
      </p>
      <section className="mt-6 space-y-3 text-sm leading-relaxed text-foreground">
        <h2 className="text-lg font-semibold">Какие данные мы обрабатываем</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Контактные данные (телефон, электронная почта)</li>
          <li>Данные учётной записи семьи (адрес семьи, роль участника)</li>
          <li>
            Сведения о здоровье и напоминания — только если вы или ваш хранитель их добавляют в
            сервис
          </li>
          <li>Технические данные устройства для безопасности входа</li>
        </ul>
        <h2 className="text-lg font-semibold">Цели и правовые основания</h2>
        <p className="text-muted-foreground">
          Обработка необходима для предоставления сервиса семейной заботы, исполнения договора с
          пользователем и выполнения обязанностей оператора. Отдельное согласие запрашивается при
          онбординге для обработки персональных данных, включая специальные категории, когда это
          требуется законом.
        </p>
        <h2 className="text-lg font-semibold">Ваши права</h2>
        <p className="text-muted-foreground">
          Вы можете запросить уточнение, блокирование или удаление данных, а также отозвать
          согласие, обратившись в поддержку Carelink. Контакты будут указаны в финальной редакции
          документа.
        </p>
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
