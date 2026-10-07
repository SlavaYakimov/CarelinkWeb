# Carelink Web — правила для агентов

Полный план: [`docs/PLAN.md`](docs/PLAN.md) (§7.1).

## Безопасность и границы

- Токены (`access`, `refresh`, `userRefresh`, `deviceSession`) **никогда** не попадают в клиентский код, props клиентских компонентов, HTML или `localStorage`.
- URL backend (`GATEWAY_URL`, пути `/v1`, `/v2`) — **только** в `src/server/gateway/*`.
- Не вызывать `/v2/auth/personal/*`.
- Новые endpoint'ы — только если они есть в Go-коде CarelinkAuth; в комментарии — ссылка на хендлер. Иначе в PR: «нужен BE-xx».
- В логах: метод, шаблон пути, статус, `traceId`, `code` — без тел запросов/ответов, без ПДн и секретов.

## Код

- Серверные модули: `import 'server-only'`.
- Формы (этап 1+): zod + Server Action + тест; экраны — e2e из §6 плана. **Playwright** — page/routing specs в `tests/e2e/`; **Cypress** — multi-step user flow в `cypress/e2e/`. Полный онбординг (создание семьи) — `cypress/e2e/_compose/onboarding-create-family.cy.ts`, только при `CYPRESS_E2E_COMPOSE=1` и BE-21 compose (`../CarelinkAuth`: `make compose-web-e2e-up`); OTP — `cy.task('fetchOnboardingOtp')` / `scripts/e2e/fetch-onboarding-otp.mjs` (логи `notification-service`, опционально `E2E_CARELINK_AUTH_ROOT`). Локальный прогон: `pnpm test:e2e:compose:onboarding`.
- Тексты UI — через `messages/ru.json` (когда появится i18n).
- PR до ~400 строк (без lockfile и сгенерированных типов).

## Проверка

```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm contracts:check
```

Контракт: `contracts/auth.openapi.yaml` → `pnpm contracts:generate` → `src/server/gateway/types.gen.ts`.
