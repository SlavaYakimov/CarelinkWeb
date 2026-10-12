---
name: carelink-commit
description: >-
  Формат epic-коммитов Carelink: conventional subject (EN) + Задача / Зачем / Что сделано (RU).
  Применять перед КАЖДЫМ git commit во всех репозиториях Carelink*. Коммит только по явной просьбе.
---

# Epic commit Carelink (Задача / Зачем / Что сделано)

Единый формат для **CarelinkAuth**, **CarelinkWeb**, **Carelink**, **CarelinkMemory** и связанных репо.

## Когда

- Пользователь просит закоммитить, разбить `git status` на эпики или переписать сообщения.
- **Любой** `git commit`, если пользователь не указал другой формат явно.
- Агент собирается выполнить `git commit` — **сначала прочитай этот skill** и оформи сообщение по шаблону.

## Жёсткие правила

1. Коммитить **только** по явному запросу (или «разбей status на эпики»).
2. **Не** добавлять `Co-authored-by: Cursor` и прочие co-author trailer'ы.
3. **Не** менять git config; без `git rebase -i` / `git add -i`; без force-push, пока не попросили.
4. Несколько эпик-коммитов лучше одного «свалки», если в дереве разные задачи.
5. Сообщение — через HEREDOC: `git commit -m "$(cat <<'EOF' ... EOF)"`.
6. Процесс: параллельно `git status`, `git diff --stat`, `git log --oneline -10` перед коммитом.

## Шаблон сообщения (обязательно)

**Subject:** `type(scope): short summary` — English, imperative, ≤72 символов.

**Тело — ровно три секции по-русски:**

```text
type(scope): short summary

Задача:
<1–3 строки — цель>

Зачем:
<1–3 строки — мотивация, баг, риск>

Что сделано:
- <файл / поведение>
- …
```

### Типы

`feat` · `fix` · `refactor` · `test` · `chore` · `docs` · `style` · `perf`

### Scope (примеры Carelink)

`e2e`, `onboarding`, `auth`, `forms`, `gateway`, `app`, `chore`, `cursor`, `env`, `memory`, `orchestrator`, `release`

### Подсказки по секциям

| Секция | Пиши | Избегай |
|--------|------|---------|
| **Задача** | Цель / результат | Списки файлов |
| **Зачем** | Мотивация, баг, риск | «сделали рефакторинг» без смысла |
| **Что сделано** | Конкретные буллеты | Размытые «fixes», «updates» |

## Разбивка на эпики

1. Параллельно: `git status`, `git diff --stat`, `git log --oneline -10`, untracked.
2. Группы (порядок зависимостей): locale/copy → lib/hooks/utils → server/api → UI; не смешивать без нужды.
3. Коммиты по порядку; в конце `git status` и таблица **hash · subject · files**.
4. **Не пушить**, пока не попросили.

## Один коммит

1. Тот же осмотр git.
2. Одно сообщение по шаблону.
3. `git add` только нужные пути (без секретов).
4. HEREDOC commit → `git status`.

## Переписывание истории

Только незапушенные или по явному согласию на force-with-lease. Без интерактивного rebase; предпочитать `reset --soft` + пересборку или `filter-branch --msg-filter`. Не push force без просьбы.

## Проверка

- Локально: hook `cursor/shared/hooks/commit-msg` (после sync в `.git/hooks/commit-msg`).
- CI PR: `cursor/shared/ci/commit-lint.sh`.

## Пример

```text
feat(orchestrator): add shared orchestrate command

Задача:
Зафиксировать единый процесс /orchestrate для фич Carelink.

Зачем:
Этапы были разрознены по репозиториям; нужен один чеклист и status.md.

Что сделано:
- cursor/shared/skills/carelink-orchestrator/SKILL.md
- cursor/shared/commands/orchestrate.md
```

## После коммитов

Кратко по-русски: таблица hash | subject | files; ahead/behind origin; push только если просили.
