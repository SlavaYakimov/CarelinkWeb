import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchUserFamilies } from '@/server/data/user-families';
import { getSession } from '@/server/session/get-session';

type PageProps = { params: Promise<{ familyId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { familyId } = await params;
  const families = await fetchUserFamilies();
  const family = families?.find((f) => f.id === familyId);
  return { title: family?.name ?? 'Семья' };
}

export default async function FamilyHubPage({ params }: PageProps) {
  const { familyId } = await params;
  const sessionCtx = await getSession();
  if (!sessionCtx) redirect('/session-ended');
  if (!sessionCtx.session.families[familyId]) redirect('/families');

  const families = await fetchUserFamilies();
  const family = families?.find((f) => f.id === familyId);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {family?.name ?? 'Семья'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Тёплые записки и метки для близких — без лишнего шума.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        <li>
          <Card className="h-full shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="size-5 text-primary" aria-hidden />
                Любовная записка
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Короткое сообщение близкому — текст увидят так, как вы его написали.
              </p>
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/families/${familyId}/sticky-notes`}>Открыть</Link>
              </Button>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card className="h-full shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="size-5 text-primary" aria-hidden />
                Участники и метки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Список семьи и мягкие метки рядом с именами.
              </p>
              <Button asChild variant="secondary" className="w-full sm:w-auto">
                <Link href={`/families/${familyId}/members`}>Открыть</Link>
              </Button>
            </CardContent>
          </Card>
        </li>
      </ul>
    </div>
  );
}
