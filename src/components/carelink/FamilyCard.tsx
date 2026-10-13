import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FamilyListItem } from '@/server/data/user-families';

function roleLabel(role: string): string {
  if (role === 'keeper' || role === 'Хранитель') return 'Хранитель';
  return 'Участник';
}

export function FamilyCard({ family }: { family: FamilyListItem }) {
  return (
    <Card className="shadow-card transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="truncate text-lg" title={family.name}>
          {family.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="size-4" aria-hidden />
            {family.memberCount} {family.memberCount === 1 ? 'участник' : 'участников'}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
            {roleLabel(family.role)}
          </span>
        </div>
        {family.pulseLabel ? (
          <p className="truncate text-sm text-muted-foreground" title={family.pulseLabel}>
            {family.pulseLabel}
          </p>
        ) : null}
        <span
          className="inline-block text-sm font-medium text-primary opacity-50"
          title="Скоро"
        >
          Открыть семью
        </span>
      </CardContent>
    </Card>
  );
}
