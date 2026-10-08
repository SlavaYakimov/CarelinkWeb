# Carelink Web

Next.js BFF для семейного приложения Carelink. Браузер не получает JWT и refresh — сессия и токены на сервере (Redis). Backend: приватный [CarelinkAuth](https://github.com/SlavaYakimov/CarelinkAuth) (gateway).

План: [`docs/PLAN.md`](docs/PLAN.md).

## Требования

- Node.js 22+
- pnpm 9+ (**только pnpm** — не используйте `npm install`, иначе возможны конфликты с `pnpm-lock.yaml`)
- Redis (для полного функционала W-03+)

## Локальный запуск

```bash
cp .env.example .env.local
# заполните SESSION_ENC_KEY (32 байта base64) и остальное

pnpm install --frozen-lockfile
pnpm dev
```

## Troubleshooting (dev)

1. Redis на `127.0.0.1:6379`, переменные в `.env.local` как в [`.env.example`](.env.example).
2. На порту **3000** — один процесс: не запускайте `pnpm dev` и `pnpm start` одновременно.
3. Ошибки webpack / `mini-css-extract-plugin` / `next/font`: `pnpm dev:reset` или `rm -rf .next node_modules && pnpm install --frozen-lockfile`.
4. `/api/health` с кодом **503** без локального gateway — нормально (status `degraded`); для входа и онбординга нужен gateway или staging URL в `GATEWAY_URL`.
5. **Recovery 501** / «Восстановление временно недоступно» на `/login/recovery`: backend поднят без web-overlay (`RECOVERY_ENABLED`). В соседнем клоне CarelinkAuth: `make compose-web-e2e-up` (три compose-файла, см. [CarelinkAuth README](https://github.com/SlavaYakimov/CarelinkAuth)). Preflight compose E2E (`node scripts/e2e-env-compose.mjs`) проверяет тот же endpoint.

Health: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## Безопасность зависимостей

`pnpm audit` после обновления Next 16 / Vitest 4 / Cypress 16 может показывать **2** записи без upstream-патча (dev-only):

| Пакет        | Цепочка                                           | Риск                           |
| ------------ | ------------------------------------------------- | ------------------------------ |
| `braces`     | `eslint-config-next` → `fast-glob` → `micromatch` | только `pnpm lint` в dev/CI    |
| `sprintf-js` | `ioredis-mock` → `fengari`                        | только unit-тесты с fake Redis |

Переоценивать при обновлении ESLint-плагинов Next и `ioredis-mock`.

## Проверки

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm contracts:check
```

E2E:

- **Playwright** (`tests/e2e/`) — страницы: роутинг, shell экранов, security smoke.
- **Cypress** (`cypress/e2e/`) — пользовательские flow (multi-step).

```bash
cp .env.example .env.local   # SESSION_ENC_KEY + Redis
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e                # Playwright (поднимает pnpm start через webServer)
pnpm test:e2e:flows          # Cypress (start-server-and-test)
pnpm test:e2e:all            # оба
```

CI: job `web-e2e` (Redis + Playwright + Cypress). Полные happy-path (SMS OTP, онбординг) — compose CarelinkAuth **BE-21**; specs в `cypress/e2e/_compose/` по умолчанию **skipped**.

### Integration: onboarding

Playwright проверяет только роутинг онбординга (`tests/e2e/onboarding-routing.spec.ts`). Полный сценарий «создание семьи» (экраны 11–16) — Cypress:

- Spec: `cypress/e2e/_compose/onboarding-create-family.cy.ts`
- Включение: `CYPRESS_E2E_COMPOSE=1` (без переменной spec в `describe.skip`)
- Нужны: Redis, BFF с `GATEWAY_URL` на compose/staging gateway, CarelinkAuth compose (BE-21)
- OTP: `cy.task('fetchOnboardingOtp')` → [`scripts/e2e/fetch-onboarding-otp.mjs`](scripts/e2e/fetch-onboarding-otp.mjs) (polling + парсинг как `CarelinkAuth/e2e/otp.py`). По умолчанию читает логи `notification-service` из соседнего клона `../CarelinkAuth` (BE-21 compose); override: `E2E_CARELINK_AUTH_ROOT` или `E2E_NOTIFICATION_LOG_CMD`.

```bash
# 1) Backend (sibling repo)
git clone https://github.com/SlavaYakimov/CarelinkAuth.git ../CarelinkAuth
cd ../CarelinkAuth && make compose-web-e2e-up   # пересобирает auth-service (--build)

# 2) Redis + .env.local (GATEWAY_URL=http://127.0.0.1:8088, SESSION_ENC_KEY, REDIS_URL)
#    Preflight scripts (test:e2e*, scripts/e2e-env.mjs) подхватывают .env.local автоматически.
#    Compose negative/happy: cy.task('flushE2eRedis') сбрасывает REDIS_URL и Redis стека CarelinkAuth (лимиты OTP).

pnpm build
pnpm test:e2e:compose:onboarding
pnpm test:e2e:compose:onboarding:negative
```

### Integration: recovery (compose)

Cypress happy path: login → family recovery → keeper approve (task) → confirm → re-login.

- Spec: `cypress/e2e/_compose/login-and-forgot-password.cy.ts`
- Run: `pnpm test:e2e:compose:recovery` (`CYPRESS_E2E_COMPOSE=1`)
- Env (опционально): `CYPRESS_RECOVERY_PHONE_DIGITS` + `E2E_RECOVERY_KEEPER_*` для уже существующей семьи (например `yakimovs@workspaces.carelink.app`)
- Без env: spec сам проходит онбординг (`composeOnboardingCreateFamily`) и затем recovery (дольше, ~3–5 мин)

Ручной OTP из логов: `node scripts/e2e/fetch-onboarding-otp.mjs email 'you@example.com'`

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
