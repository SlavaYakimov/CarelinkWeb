export function MemberLabelBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex max-w-full truncate rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
      {text}
    </span>
  );
}
