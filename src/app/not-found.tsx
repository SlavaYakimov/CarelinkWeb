import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-card">
        <h1 className="text-2xl font-semibold">Страница не найдена</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Такого адреса нет в Carelink. Проверьте ссылку или вернитесь к списку семей.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/families">Мои семьи</Link>
        </Button>
        <p className="mt-4 text-sm">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center text-primary hover:underline"
          >
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
