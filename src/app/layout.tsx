import type { Metadata } from 'next';
import { OfflineBanner } from '@/components/carelink/OfflineBanner';
import { Toaster } from '@/components/ui/sonner';
import { inter, manrope } from '@/lib/fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Carelink',
    template: '%s — Carelink',
  },
  description: 'Семейное приложение Carelink',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${manrope.variable} min-h-screen font-sans antialiased`}>
        <OfflineBanner />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
