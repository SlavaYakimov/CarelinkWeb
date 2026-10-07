---
name: e2e-happy-path
description: Реализует Cypress-спек happy path заданного flow в Carelink Web и доказывает стабильность двумя прогонами подряд. Переиспользует cypress/support, compose-зависимые спеки кладёт в cypress/e2e/_compose, не трогает продуктовый код. Выход — spec и /tmp/e2e/<slug>/happy.json.
---

# e2e-happy-path

Вход: `flow.md`, `recon.md`.
Выход: спек в `cypress/e2e/<slug>.cy.ts` или `cypress/e2e/_compose/<slug>.cy.ts`, `happy.json`.

## Правила

1. Шаги — из `flow.md`, один в один. Каждый шаг заканчивается assert'ом результата (`cy.location('pathname')`, видимый текст, состояние кнопки) — не просто кликом.
2. Команды — из `cypress/support/*`. Новые — туда же, с объявлением в соответствующем `.d.ts`. В спеке шаги не дублировать.
3. Compose-зависимость из `flow.md` → спек в `_compose/`, в начале `describe`: `if (!Cypress.env('E2E_COMPOSE')) this.skip()`. OTP — только `cy.task('fetchOnboardingOtp', { channel, to, skipPriorMatches? })`.
4. Селекторы: `#id`, `aria-label`, `role`, `cy.contains('button', …)`. `data-testid` в компоненты не добавлять.
5. Явные таймауты — только на ожидание backend / OTP, с комментарием «почему». `cy.wait(число)` запрещён.
6. Данные — уникальные на старте (`Date.now()`), не захардкожены. Не логировать телефоны, коды, пароли, cookie (`cy.log` и комментарии тоже).
7. Happy path ходит в реальный gateway. `cy.intercept` для подмены ответов здесь не используется.
8. Прогон: `pnpm cypress run --spec <spec>` **2 раза подряд** под нужным env (для compose — по образцу `test:e2e:compose:onboarding` в `package.json`). Flaky → найти причину, не маскировать.
9. Продуктовый код не править. Если happy path не проходит из-за бага — зафиксируй падение как `BUG-<n>` в `happy.json`, тест оставь красным (не `skip`).

## `happy.json`

```json
{
  "flow": "<slug>",
  "spec": "cypress/e2e/<slug>.cy.ts",
  "runs": [
    { "n": 1, "passed": true, "durationMs": 0 },
    { "n": 2, "passed": true, "durationMs": 0 }
  ],
  "newCommands": ["..."],
  "bugs": [
    { "id": "BUG-1", "step": 3, "expected": "...", "actual": "...", "fileLine": "..." }
  ]
}
```

## Готово, когда

Оба прогона зелёные, либо падение описано как `BUG-n` с `file:line`. `pnpm lint && pnpm typecheck` по изменённым файлам чистые.
