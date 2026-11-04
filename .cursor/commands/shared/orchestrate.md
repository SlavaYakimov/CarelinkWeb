# /orchestrate — фича от спеки до релиза

Вход: `$ARGUMENTS` — имя или slug фичи (kebab-case), например `recovery-via-family` или «восстановление через семью».

Если `$ARGUMENTS` пуст — один раз спроси: «Какую фичу ведём? (slug)» и остановись.

## Обязательно прочитать

1. **`cursor/shared/skills/carelink-orchestrator/SKILL.md`** — этапы, гейты, репозитории.
2. **`cursor/shared/rules/carelink-process.mdc`**
3. CarelinkMemory: `README.md`, `status.md`, `features/<slug>/` (или создать из `features/_template/`).

Перед **каждым** `git commit` в любом репо — **`cursor/shared/skills/carelink-commit/SKILL.md`**.

## Режим работы

- Определи текущий этап по **`features/<slug>/status.md`**. Если файла нет — начни с этапа 1 (Спека).
- Выполняй **только текущий этап** (или подэтап, который явно попросил пользователь). Не перескакивай гейты «ок».
- После этапа обнови `features/<slug>/status.md`, при необходимости CarelinkMemory `status.md` и `log/`.
- На гейтах **1, 3, 6, 7 (мерж), 8 (релиз)** — отчёт по шаблону оркестратора и вопрос **«ок / правки?»**. Без «ок» не начинай следующий этап и не мержи.

## Этапы (кратко)

| # | Этап | Действие агента |
|---|------|-----------------|
| 1 | Спека | `spec.md`: Given/When/Then + OpenAPI delta + ПДн → гейт «ок» |
| 2 | Сервер | PR CarelinkAuth, OpenAPI, тесты, CI |
| 3 | Staging | Запросы к `https://gateway-staging-0a47.up.railway.app`, отчёт → гейт «ок» |
| 4 | Web | PR CarelinkWeb: `contracts:check`, Playwright |
| 5 | Ревью + security | Независимый проход checklists; цикл замечаний |
| 6 | Integration e2e | compose web+gateway+auth+redis, негативы → гейт «ок» |
| 7 | Мерж + docs | Мерж PR после «ок»; Memory docs |
| 8 | Release | Skill **`carelink-release`** после «ок» |

## Subagent'ы (по желанию)

- Этап 5: отдельный subagent (`Task`), **не** автор PR — чек-листы review/security.
- Этап 6: можно делегировать web e2e pipeline (`/e2e-flow` или skill'ы `e2e-*`) с compose.

## Запрещено

- Push/merge в `main` без PR и без «ок».
- Удаление `main`, force-push в `main`, удаление репозиториев — см. `carelink-process.mdc`.
- ПДн и секреты в коммитах, логах staging, отчётах.

## Финал сессии

Краткая таблица: этап · статус · PR · следующий шаг. Укажи путь к `features/<slug>/status.md`.
