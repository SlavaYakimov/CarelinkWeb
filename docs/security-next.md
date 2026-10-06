# Next.js: оценка экспозиции (Carelink Web)

**Дата:** 2026-10-06  
**Текущая версия в репозитории:** Next.js `^15.5.4` (App Router, `output: 'standalone'`, self-hosted в РФ).

## Решение по апгрейду на Next 16

**Остаёмся на 15.5.x** до отдельного решения команды. Мажорные обновления Dependabot не предлагает (см. `.github/dependabot.yml`).

Для ветки 15.x при необходимости — **patch/minor** в рамках 15.5 (например, до последнего патча с backport исправлений image optimizer), без перехода на 16.

## Релевантные GHSA для Next 16 (контекст)

| Advisory | Риск | Затрагивает Carelink Web? |
| -------- | ---- | ------------------------- |
| [GHSA-3x4c-7xq6-9pq8](https://github.com/vercel/next.js/security/advisories/GHSA-3x4c-7xq6-9pq8) — неограниченный disk cache `/_next/image` | DoS (диск) | **Низкий:** в `src/` нет `next/image`; remote/local patterns не настроены. Эндпоинт `/_next/image` существует в рантайме Next, но без вызовов оптимизации нагрузка минимальна. |
| [GHSA-9g9p-9gw9-jx7f](https://github.com/vercel/next.js/security/advisories/GHSA-9g9p-9gw9-jx7f) — DoS через `remotePatterns` | DoS (память) | **Нет:** `images.remotePatterns` не заданы в `next.config.ts`. |
| [GHSA-h64f-5h5j-jqjh](https://github.com/vercel/next.js/security/advisories/GHSA-h64f-5h5j-jqjh) — DoS local images | DoS (память) | **Низкий:** нет `next/image` для локальных ассетов через optimizer. |
| [GHSA-q8wf-6r8g-63ch](https://github.com/vercel/next.js/security/advisories/GHSA-q8wf-6r8g-63ch) — DoS SVG в optimizer | DoS (CPU) | **Нет:** remote patterns не включены. |
| [GHSA-2xp9-vwfh-vxw4](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) — RCE AVIF в optimizer | Critical | **Нет:** AVIF через `/_next/image` не используется. |

## ISR, `use cache`, Cache Components

- В проекте **нет** `use cache`, Draft Mode и Cache Components (`next.config.ts` без experimental cache flags).
- Страницы auth — динамические Server Components / Server Actions, без SSG/ISR для персональных данных.
- Риски cache poisoning ISR/SSG для **16.x** к текущему стеку **не применимы**.

## Рекомендации при сохранении 15.5.x

1. Следить за patch-релизами 15.5.x с backport fix для image optimizer (если позже появится `next/image`).
2. Перед включением `next/image`: задать `images.remotePatterns` / `images.localPatterns` явно, рассмотреть `images.unoptimized` для self-hosted, если optimizer не нужен.
3. `pnpm audit --prod` уже в CI (`web-check`); major — только вручную.

## Self-hosted BFF

Деплой — Docker standalone за ingress в РФ, не Vercel. Advisories с формулировкой «not impacted on Vercel» для нас **не снимают** риск полностью, но фактическое использование optimizer в коде отсутствует.
