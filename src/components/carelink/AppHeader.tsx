import { logoutAction } from '@/server/actions/logout';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-8">
        <p className="font-heading text-lg font-semibold text-primary">Carelink</p>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" size="sm">
            Выйти
          </Button>
        </form>
      </div>
    </header>
  );
}
