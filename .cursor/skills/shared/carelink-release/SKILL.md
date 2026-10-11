---
name: carelink-release
description: >-
  Единый SemVer-релиз CarelinkAuth, CarelinkWeb и Carelink: один номер версии,
  CHANGELOG из conventional commits, git tag + GitHub Release в каждом репо.
  Только после явного «ок» владельца.
---

# Release Carelink (единый SemVer)

Вызывается из оркестратора фичи (**этап 8**) или по явной просьбе после мержа и обновления docs.

## Предусловия

- Фича прошла гейты оркестратора; PR сервера и web **влиты**; CarelinkMemory обновлён.
- **«ок» Славы** на релиз (отдельно от «ок» на мерж).
- Коммиты в релизном диапазоне соответствуют **`carelink-commit`** (для CHANGELOG).
- **Не** релизить с main, если там есть незавершённые WIP без «ок».

## Версионирование

- **Один номер** для трёх репозиториев: **CarelinkAuth**, **CarelinkWeb**, **Carelink** (RN).
- Формат тега: **`vMAJOR.MINOR.PATCH`** (SemVer 2.0), например **`v0.1.0`**.
- Правила bump (conventional commits с момента предыдущего тега):
  - `feat` → **MINOR** (или MAJOR, если breaking явно помечен `!` / BREAKING CHANGE)
  - `fix`, `perf` → **PATCH**
  - `docs`, `chore`, `style`, `test`, `refactor` без user-facing эффекта — **не** bump сами по себе; включать в CHANGELOG как «Maintenance», bump PATCH только если релиз уже решён и нужен маркер (по согласованию)
- Если тегов ещё нет — старт **`v0.1.0`** или версия из `package.json` / `VERSION` в репо (сверить с владельцем).

## CHANGELOG

1. В каждом репо: коммиты **`previous_tag..HEAD`** (или `main` since last tag).
2. Группировка по типу: Features (`feat`), Fixes (`fix`), …; subject из commit (EN).
3. В теле коммитов секции **Задача/Зачем** можно сжать в одну строку описания для пользователей — **без ПДн**.
4. Файл **`CHANGELOG.md`**: секция `## [vX.Y.Z] — DD.MM.YYYY` (Asia/Yekaterinburg).

## Шаги (каждый репо — отдельная ветка `cursor/release-vX.Y.Z`)

1. Обновить версию в артеfact репо (если есть): `package.json`, `VERSION`, embed в mobile — по принятому в репо месту.
2. Дописать **`CHANGELOG.md`**.
3. Коммит по **`carelink-commit`**, например `chore(release): cut v0.1.0`.
4. Тег **`vX.Y.Z`** на этот коммит; push tag.
5. **GitHub Release** с notes из CHANGELOG (draft → publish после «ок», если политика требует).
6. Повторить для **Auth → Web → Mobile** (или параллельно три PR — но **одинаковый** номер версии).
7. CarelinkMemory: строка в `status.md`, запись в `log/YYYY-MM.md` (версия, дата, ссылки на releases).

## Проверки

- CI зелёный на release-ветках.
- Теги **не** перезаписывать (`git push --force` на tags запрещён без «ок»).
- Не удалять старые releases без «ок».

## Отчёт владельцу

- Таблица: репо · tag · PR · GitHub Release URL.
- Mermaid: `merged features → changelog → tag → release`.
- Вопрос: **«ок публиковать / что поправить?»**

## Связь с оркестратором

Этап 8 в **`carelink-orchestrator`**. До «ок» на релиз — только черновик CHANGELOG и PR, без push тегов.
