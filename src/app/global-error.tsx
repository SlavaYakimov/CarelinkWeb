'use client';

import * as React from 'react';
import { inter, manrope } from '@/lib/fonts';
import '@/styles/globals.css';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body
        className={`${inter.variable} ${manrope.variable} flex min-h-screen items-center justify-center bg-background px-4 font-sans antialiased`}
      >
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-card">
          <h1 className="text-xl font-semibold text-foreground">Сервис временно недоступен</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Произошла непредвиденная ошибка. Мы уже работаем над исправлением.
          </p>
          <button
            type="button"
            className="mt-6 inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            onClick={() => reset()}
          >
            Повторить
          </button>
        </div>
      </body>
    </html>
  );
}
