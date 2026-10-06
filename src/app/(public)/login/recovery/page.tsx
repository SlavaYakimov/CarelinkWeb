import { RecoveryRequestForm } from '@/components/carelink/RecoveryRequestForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RecoveryRequestPage() {
  return (
    <Card className="mx-auto w-full max-w-[440px] shadow-card">
      <CardHeader>
        <CardTitle className="text-2xl">Восстановление через семью</CardTitle>
        <CardDescription>
          Укажите адрес семьи и телефон. Хранитель получит запрос; ответ сервиса одинаковый, чтобы
          не раскрывать, есть ли такой аккаунт.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RecoveryRequestForm />
      </CardContent>
    </Card>
  );
}
