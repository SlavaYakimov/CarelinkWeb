import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function LegalDraftNotice() {
  return (
    <Alert variant="warning" className="mb-6">
      <AlertTitle>Черновик для юристов</AlertTitle>
      <AlertDescription>
        Текст ниже — рабочая заготовка для согласования с юристом. Не является финальной юридической
        редакцией политики или оферты.
      </AlertDescription>
    </Alert>
  );
}
