import { FamiliesPageSkeleton } from '@/components/carelink/FamiliesPageSkeleton';

export default function AppSectionLoading() {
  return (
    <div aria-busy="true" aria-live="polite" aria-label="Загрузка">
      <FamiliesPageSkeleton />
    </div>
  );
}
