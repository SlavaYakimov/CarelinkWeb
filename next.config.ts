import type { NextConfig } from 'next';

const appOrigin = process.env.APP_ORIGIN;

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    taint: true,
    ...(appOrigin
      ? {
          serverActions: {
            allowedOrigins: [new URL(appOrigin).host],
          },
        }
      : {}),
  },
  serverExternalPackages: ['pino', 'ioredis'],
};

export default nextConfig;
