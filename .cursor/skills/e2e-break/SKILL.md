---
name: e2e-break
description: Пишет негативные и граничные Cypress-тесты по списку рисков, чтобы сломать заданный flow Carelink Web. Ожидания в тестах — правильное поведение по коду, а не текущее; найденные баги помечаются BUG-n и не маскируются. Выход — negative-спеки и /tmp/e2e/<slug>/break.json.
---

# e2e-break

Вход: `risks.md`, `happy.json`, `flow.md`.
Выход: `cypress/e2e/<slug>.negative.cy.ts` (и/или `cypress/e2e/_compose/<slug>.negative.cy.ts`), `break.json`.

## Правила

1. На каждый риск из `risks.md` — тест или строка в `break.json` с причиной отсутствия.
2. Инструменты: `cy.intercept` (4xx / 5xx / таймаут / битый JSON — только для негативных сценариев), прямой `cy.visit` на поздний шаг, `cy.go('back')`, `cy.clearCookie`, двойной клик, `cy.clock()` для cooldown, невалидные данные по границам zod.
3. Ожидание в тесте — **правильное поведение** из колонки `risks.md`. Если UI сейчас ведёт себя иначе — тест падает. Не подгонять assert под баг.
4. Падающий тест: оставить, пометить `it.skip('… // BUG-<n>')` с комментарием-ссылкой на `break.json`. Нумерация `BUG-n` продолжает `happy.json`.
5. Один «шумный» прогон: `pnpm cypress run --spec <spec> --config defaultCommandTimeout=2000,viewportWidth=375`. Падения только под шумом — отдельная метка `flaky-under-noise`.
6. Та же дисциплина, что в `e2e-happy-path`: без `cy.wait(ms)`, без правок продуктового кода, без `data-testid`, без логирования секретов, новые команды — в `cypress/support/*` с `.d.ts`.

## `break.json`

```json
{
  "flow": "<slug>",
  "specs": ["cypress/e2e/<slug>.negative.cy.ts"],
  "risks": [
    {
      "id": "R-1",
      "test": "it name | null",
      "reason": "если test = null",
      "result": "pass | fail | flaky-under-noise",
      "bug": "BUG-2 | null"
    }
  ],
  "bugs": [
    {
      "id": "BUG-2",
      "risk": "R-1",
      "severity": "blocks | degrades | cosmetic",
      "steps": ["..."],
      "expected": "...",
      "actual": "...",
      "fileLine": "...",
      "side": "frontend | backend",
      "hypothesis": "..."
    }
  ]
}
```

## Готово, когда

Все риски разобраны; каждый `fail` имеет `BUG-n` с `file:line` и `side`; `pnpm lint && pnpm typecheck` по изменённым файлам чистые.
