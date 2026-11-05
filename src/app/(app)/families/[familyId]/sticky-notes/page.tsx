import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { StickyNoteSendForm } from '@/components/carelink/sticky-notes/StickyNoteSendForm';
import { StickyNoteWidgetCard } from '@/components/carelink/sticky-notes/StickyNoteWidgetCard';
import { fetchFamilyMembers } from '@/server/data/family-members';
import { fetchStickyNoteWidget } from '@/server/data/sticky-notes';
import { getSession } from '@/server/session/get-session';

export const metadata: Metadata = {
  title: 'Любовная записка',
};

type PageProps = { params: Promise<{ familyId: string }> };

export default async function StickyNotesPage({ params }: PageProps) {
  const { familyId } = await params;
  const sessionCtx = await getSession();
  if (!sessionCtx) redirect('/session-ended');
  if (!sessionCtx.session.families[familyId]) redirect('/families');

  const [members, widget] = await Promise.all([
    fetchFamilyMembers(familyId),
    fetchStickyNoteWidget(familyId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <div>
        <p className="text-sm">
          <Link href={`/families/${familyId}`} className="text-primary hover:underline">
            ← К семье
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Любовная записка</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Свободный текст любому участнику семьи. Подтверждения от получателя не требуется.
        </p>
      </div>

      <StickyNoteWidgetCard familyId={familyId} note={widget?.note ?? null} />

      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold">Отправить</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Текст шифруется на вашем устройстве перед отправкой (AES-256-GCM, HKDF-SHA256).
        </p>
        {members === null ? (
          <p className="text-sm text-muted-foreground">
            Список участников временно недоступен (нужен BE-12). Отправка появится, когда backend
            вернёт участников семьи.
          </p>
        ) : (
          <StickyNoteSendForm
            familyId={familyId}
            members={members}
            currentUserId={sessionCtx.session.userId}
          />
        )}
      </section>
    </div>
  );
}
