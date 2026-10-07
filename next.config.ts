import type { NextConfig } from 'next';

const appOrigin = process.env.APP_ORIGIN;
const isDev = process.env.APP_ENV === 'development' || process.env.NODE_ENV === 'development';

function serverActionAllowedOrigins(): string[] | undefined {
  if (!appOrigin) return undefined;
  const hosts = new Set<string>([new URL(appOrigin).host]);
  if (isDev) {
    hosts.add('localhost:3000');
    hosts.add('127.0.0.1:3000');
  }
  return [...hosts];
}

const allowedOrigins = serverActionAllowedOrigins();

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    taint: true,
    ...(allowedOrigins
      ? {
          serverActions: {
            allowedOrigins,
          },
        }
      : {}),
  },
  serverExternalPackages: ['pino', 'ioredis'],
};

export default nextConfig;
