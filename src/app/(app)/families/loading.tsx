import { FamiliesPageSkeleton } from '@/components/carelink/FamiliesPageSkeleton';

export default function FamiliesLoading() {
  return (
    <div aria-busy="true" aria-live="polite" aria-label="Загрузка списка семей">
      <FamiliesPageSkeleton />
    </div>
  );
}
