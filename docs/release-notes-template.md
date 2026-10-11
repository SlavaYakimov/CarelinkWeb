# Carelink Web vX.Y.Z

**Дата:** YYYY-MM-DD  
**CarelinkAuth / Carelink:** укажите согласованные теги SemVer (единая линия релизов).

## Highlights

- …

## Изменения

### feat

- …

### fix

- …

### chore / docs / refactor

- …

## Проверка перед публикацией

```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm contracts:check
```

## Deploy

- Vercel: production promote после мержа в `main` и тега `vX.Y.Z` (по процессу команды).
