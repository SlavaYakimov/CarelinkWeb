import { RateLimitPanel } from '@/components/carelink/RateLimitPanel';

type PageProps = {
  searchParams: Promise<{ retryAfter?: string }>;
};

export default async function LoginTooManyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = Number(params.retryAfter ?? '60');
  const retryAfter = Number.isFinite(raw) ? Math.min(Math.max(0, Math.floor(raw)), 3600) : 60;

  return <RateLimitPanel initialSeconds={retryAfter} />;
}
