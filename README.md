# Carelink Web

Next.js BFF для семейного приложения Carelink. Браузер не получает JWT и refresh — сессия и токены на сервере (Redis). Backend: приватный [CarelinkAuth](https://github.com/SlavaYakimov/CarelinkAuth) (gateway).

План: [`docs/PLAN.md`](docs/PLAN.md).

## Требования

- Node.js 22+
- pnpm 9+
- Redis (для полного функционала W-03+)

## Локальный запуск

```bash
cp .env.example .env.local
# заполните SESSION_ENC_KEY (32 байта base64) и остальное

pnpm install
pnpm dev
```

Health: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## Проверки

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm contracts:check
```

E2E (smoke):

```bash
pnpm build && pnpm start   # в другом терминале
pnpm exec playwright install chromium
pnpm test:e2e
```

**TODO:** job `web-e2e` против полного docker-compose CarelinkAuth (приватный репо, нужен `GITHUB_TOKEN` / compose overlay BE-21).

## Docker

```bash
docker build -t carelink-web .
docker run --rm -p 3000:3000 \
  -e APP_ENV=production \
  -e APP_ORIGIN=http://localhost:3000 \
  -e GATEWAY_URL=http://host.docker.internal:8088 \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e SESSION_ENC_KEY="$(openssl rand -base64 32)" \
  carelink-web
curl -s http://localhost:3000/api/health
```

## Контракт auth

Файл: `contracts/auth.openapi.yaml`. Типы: `pnpm contracts:generate` → `src/server/gateway/types.gen.ts`.

Синхронизация из CarelinkAuth:

```bash
export GITHUB_TOKEN=...   # read access к CarelinkAuth
pnpm contracts:sync
```

## Staging gateway (ручные проверки)

Демо: `https://gateway-staging-0a47.up.railway.app` — только локально, не в CI.
