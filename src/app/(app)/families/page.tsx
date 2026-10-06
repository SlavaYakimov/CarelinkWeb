import Link from 'next/link';
import { Plus } from 'lucide-react';
import { FamilyCard } from '@/components/carelink/FamilyCard';
import { Button } from '@/components/ui/button';
import { fetchUserFamilies } from '@/server/data/user-families';

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
        <p className="text-sm text-muted-foreground">
          Не удалось загрузить список. Обновите страницу.
        </p>
      ) : families.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center shadow-card">
          <h2 className="text-lg font-semibold">Пока нет семей</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Создайте семью или примите приглашение, когда раздел будет доступен.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/families/new">Создать семью</Link>
          </Button>
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
