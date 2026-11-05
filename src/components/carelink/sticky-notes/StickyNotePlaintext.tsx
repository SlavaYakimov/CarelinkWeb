'use client';

/** Renders sender text verbatim: React escapes HTML; whitespace preserved. */
export function StickyNotePlaintext({ text }: { text: string }) {
  return (
    <p
      className="whitespace-pre-wrap break-words text-base text-foreground"
      data-testid="sticky-note-plaintext"
    >
      {text}
    </p>
  );
}
