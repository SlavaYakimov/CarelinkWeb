import type { Metadata } from 'next';
import { CreateFamilyForm } from '@/components/carelink/CreateFamilyForm';

export const metadata: Metadata = {
  title: 'Создать семью',
};

export default function CreateFamilyPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-10">
      <CreateFamilyForm />
    </div>
  );
}
