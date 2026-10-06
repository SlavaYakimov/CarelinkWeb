import localFont from 'next/font/local';

export const inter = localFont({
  src: [
    {
      path: '../../public/fonts/inter-cyrillic-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-latin-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-cyrillic-500.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
});

export const manrope = localFont({
  src: [
    {
      path: '../../public/fonts/manrope-cyrillic-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/manrope-latin-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/manrope-cyrillic-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-manrope',
  display: 'swap',
});
