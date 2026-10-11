# Carelink Web — правила для агентов

Полный план: [`docs/PLAN.md`](docs/PLAN.md) (§7.1).

## Memory bank (CarelinkMemory)

Субмодуль [`memory/`](memory/) → [CarelinkMemory](https://github.com/SlavaYakimov/CarelinkMemory) (закреплённый коммит в gitlink). После клона: `git submodule update --init memory`.

Перед задачей читай:

- [`memory/README.md`](memory/README.md) — структура и правила обновления
- [`memory/status.md`](memory/status.md) — текущее состояние репозиториев и стендов
- [`memory/process/orchestrator/SKILL.md`](memory/process/orchestrator/SKILL.md) — оркестратор фичи

Общие Cursor-правила синхронизируются в [`.cursor/rules/shared/`](.cursor/rules/shared/) скриптом [`scripts/sync-cursor-shared.sh`](scripts/sync-cursor-shared.sh) (не редактировать shared вручную). Repo-специфичные правила — [`.cursor/rules/web.mdc`](.cursor/rules/web.mdc), [`commits.mdc`](.cursor/rules/commits.mdc), [`forms.mdc`](.cursor/rules/forms.mdc) и skills в `.cursor/skills/` — не трогает sync.

**Обновление знаний:** правки только в CarelinkMemory (свой PR в `cursor/*` / `docs/*`), затем в CarelinkWeb — bump субмодуля `memory` и `./scripts/sync-cursor-shared.sh`, коммит vendored `.cursor/rules/shared/`.

## Безопасность и границы

- Токены (`access`, `refresh`, `userRefresh`, `deviceSession`) **никогда** не попадают в клиентский код, props клиентских компонентов, HTML или `localStorage`.
- URL backend (`GATEWAY_URL`, пути `/v1`, `/v2`) — **только** в `src/server/gateway/*`.
- Не вызывать `/v2/auth/personal/*`.
- Новые endpoint'ы — только если они есть в Go-коде CarelinkAuth; в комментарии — ссылка на хендлер. Иначе в PR: «нужен BE-xx».
- В логах: метод, шаблон пути, статус, `traceId`, `code` — без тел запросов/ответов, без ПДн и секретов.

## Код

- Серверные модули: `import 'server-only'`.
- Формы (этап 1+): zod + Server Action + тест; экраны — e2e из §6 плана. **Playwright** — page/routing specs в `tests/e2e/`; **Cypress** — multi-step user flow в `cypress/e2e/`. Полный онбординг (создание семьи) — `cypress/e2e/_compose/onboarding-create-family.cy.ts`, только при `CYPRESS_E2E_COMPOSE=1` и BE-21 compose (`../CarelinkAuth`: `make compose-web-e2e-up`); OTP — `cy.task('fetchOnboardingOtp')` / `scripts/e2e/fetch-onboarding-otp.mjs` (логи `notification-service`, опционально `E2E_CARELINK_AUTH_ROOT`). Локальный прогон: `pnpm test:e2e:compose:onboarding`. Восстановление через семью (compose) — `cypress/e2e/_compose/login-and-forgot-password.cy.ts`, `pnpm test:e2e:compose:recovery`; keeper approve — `cy.task('approveRecoveryRequest')` / `scripts/e2e/approve-recovery-compose.mjs` (нужны `E2E_RECOVERY_KEEPER_*`, `CYPRESS_RECOVERY_PHONE_DIGITS`, семья уже в стеке).
- Тексты UI — через `messages/ru.json` (когда появится i18n).
- PR до ~400 строк (без lockfile и сгенерированных типов).

## Коммиты

Subject — conventional commits на английском (`type(scope): …`, ≤72). Тело — секции **Задача / Зачем / Что сделано** на русском. Подробности: [`.cursor/rules/commits.mdc`](.cursor/rules/commits.mdc), shared [`.cursor/rules/shared/carelink-commit.mdc`](.cursor/rules/shared/carelink-commit.mdc).

После `pnpm install` hook `.githooks/commit-msg` (копия из `memory/cursor/shared/hooks/` через `sync-cursor-shared.sh`). На PR — `memory/cursor/shared/ci/commit-lint.sh` через `scripts/lint-pr-commits.sh`. Skill: `.cursor/skills/shared/carelink-commit/SKILL.md`. Сообщение через HEREDOC; без co-author trailer'ов Cursor.

## Релиз (SemVer)

Единая линия с CarelinkAuth / Carelink: [`VERSION`](VERSION), `package.json`, [`CHANGELOG.md`](CHANGELOG.md). `./scripts/release.sh` — dry-run (команды tag/`gh release`); `--publish` только локально по явному решению (не мержить/не тегать из агента без «ок»).

## Проверка

```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm contracts:check
```

Контракт: `contracts/auth.openapi.yaml` → `pnpm contracts:generate` → `src/server/gateway/types.gen.ts`.
