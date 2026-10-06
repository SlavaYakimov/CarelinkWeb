import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    taint: true,
  },
  serverExternalPackages: ['pino', 'pino-pretty', 'ioredis'],
};

export default nextConfig;
