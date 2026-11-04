export function FamiliesPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8" aria-hidden>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
        </div>
        <div className="h-11 w-40 animate-pulse rounded-[var(--radius-md)] bg-muted motion-reduce:animate-none" />
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((key) => (
          <li
            key={key}
            className="h-36 animate-pulse rounded-xl bg-muted motion-reduce:animate-none"
          />
        ))}
      </ul>
    </div>
  );
}
