import { requireSignInFlow } from '@/server/flows/signin-flow';

/** Placeholder shell for W-06 — change-password step after sign-in. */
export default async function ChangePasswordPlaceholderPage() {
  await requireSignInFlow('change-password');

  return (
    <div className="mx-auto w-full max-w-[440px] rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
      Смена временного пароля (экран 05) — задача W-06.
    </div>
  );
}
