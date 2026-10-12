import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { FamiliesLoadError } from '@/components/carelink/FamiliesLoadError';
import { FamilyCard } from '@/components/carelink/FamilyCard';
import { Button } from '@/components/ui/button';
import { fetchUserFamilies } from '@/server/data/user-families';

export const metadata: Metadata = {
  title: 'Мои семьи',
};

export default async function FamiliesHomePage() {
  const families = await fetchUserFamilies();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Мои семьи</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Семьи, в которых вы участвуете как хранитель или участник.
          </p>
        </div>
        <Button asChild>
          <Link href="/families/new">
            <Plus className="size-4" aria-hidden />
            Создать семью
          </Link>
        </Button>
      </div>

      {families === null ? (
        <FamiliesLoadError />
      ) : families.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center shadow-card">
          <h2 className="text-lg font-semibold">Пока нет семей</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Создайте семью сейчас — или попросите хранителя прислать ссылку-приглашение из
            приложения Carelink (SMS или мессенджер).
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/families/new">Создать семью</Link>
            </Button>
          </div>
          <details className="mx-auto mt-6 max-w-md text-left text-sm">
            <summary className="cursor-pointer text-primary">Как присоединиться к семье</summary>
            <p className="mt-2 text-muted-foreground">
              Раздел приглашений в веб-версии пока готовится. Пока что хранитель отправляет
              приглашение из мобильного приложения — перейдите по ссылке и завершите вход по
              инструкции в сообщении.
            </p>
          </details>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {families.map((family) => (
            <li key={family.id}>
              <FamilyCard family={family} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
