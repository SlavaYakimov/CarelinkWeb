import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { inter, manrope } from '@/lib/fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Carelink',
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
