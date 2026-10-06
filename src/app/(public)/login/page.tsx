export default function LoginPlaceholderPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-xl font-semibold">Вход</h1>
      <p className="mt-2 max-w-md text-center text-neutral-600">
        Экран входа (W-04) будет здесь. Middleware уже проверяет cookie сессии для раздела
        приложения.
      </p>
    </main>
  );
}
