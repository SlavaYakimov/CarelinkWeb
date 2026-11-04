# Design-stage pipeline audit — Carelink Web

**Дата:** 2026-10-13  
**Репозиторий:** CarelinkWeb (Next.js)  
**Процесс:** CarelinkMemory `carelink-orchestrator` этап 4 — `ui-ux-pro-max` → `impeccable` → Emil motion → `frontend-design` (ключевые экраны).  
**Источник skills:** [CarelinkMemory `main`](https://github.com/SlavaYakimov/CarelinkMemory) (`cursor/shared/skills/*`).  
**Визуальный эталон:** корневой [`DESIGN.md`](../../DESIGN.md), тон **«Спокойная забота»**.

## Метод

1. **ui-ux-pro-max** — выборки через `scripts/search.py` (a11y/focus, touch targets, forms/errors, nextjs auth); сверка с `references/quick-reference.md` и stack `nextjs.csv`.
2. **impeccable** — playbooks: `craft-floor`, `clarify`, `quieter`, `distill`, `harden`, `operate`, `onboard`, `polish` (без CLI).
3. **Emil motion** — `review-animations`, `break-ui`, `mobile-native` (Modified Carelink: минимум motion, `prefers-reduced-motion`, без bounce на login).
4. **frontend-design + copy** — углублённо: онбординг, `/login`, публичные invite/delegate landing.
5. **Визуально** — `pnpm dev` (Redis локально, gateway не требовался для GET), Playwright: desktop 1280×800 и mobile 390×844, 37 маршрутов × 2 = **74 PNG**. Манифест: `/opt/cursor/artifacts/design-pipeline-screenshots/manifest.json`. Скрипт: [`scripts/design-pipeline-screenshots.mjs`](../../scripts/design-pipeline-screenshots.mjs).

### Ограничения прогона

- Без сессии и flow-cookie большинство шагов онбординга, SMS/push/keeper и app-оболочки **редиректят** на `/login` или `/onboarding/email` — см. колонку «Фактический URL» в манифесте. Для полного покрытия mid-flow нужен compose E2E или seeded flows.
- Скриншоты app (`/families`, `/invites/*`) в этом прогоне = экран входа с `?next=`.

---

## Топ-10 (приоритет)

| #   | Находка                                                                                                   | Skill                            | Приоритет           | Статус                                              |
| --- | --------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------- | --------------------------------------------------- |
| 1   | Текстовые ссылки в auth footer и формах без единого `focus-visible` (клавиатура)                          | ui-ux-pro-max, craft-floor       | **важно**           | **исправлено** (`globals.css`)                      |
| 2   | Jargon «backend / Web Push / platform ios/android» на шаге устройства онбординга                          | clarify, frontend-design         | **важно**           | **исправлено**                                      |
| 3   | Dev-badge «Шлюз авторизации семейных сетей» — системный жаргон на user-facing колонке                     | clarify, quieter                 | **важно**           | **исправлено** → «Стенд разработки»                 |
| 4   | Длинные названия семьи / pulse без `truncate` — риск overflow в сетке                                     | break-ui, harden                 | **важно**           | **исправлено** (`FamilyCard`)                       |
| 5   | Псевдо-ссылка «Открыть семью» с `aria-disabled` на `<a>`                                                  | ui-ux-pro-max, craft-floor       | **важно**           | **исправлено** → `<span>`                           |
| 6   | Прогресс `StepShell`: `transition-all` (лишние свойства, width animation)                                 | review-animations                | **желательно**      | **смягчено** (`transition-[width]`, reduced-motion) |
| 7   | Несогласованные глаголы CTA на OTP: «Подтвердить» vs «Продолжить»; «Отправить SMS-код» vs «Отправить код» | clarify, onboard                 | **желательно**      | план                                                |
| 8   | Mobile auth: скрыт marketing-aside (`lg:`), только compact brand — мало «воздуха» и контекста бренда      | frontend-design, distill         | **желательно**      | план                                                |
| 9   | `AppMobileNav`: slide-in overlay на частом пути (menu) — частота vs motion                                | review-animations, mobile-native | **желательно**      | план                                                |
| 10  | Mid-flow экраны не снимаются без Redis flow — аудит визуала OTP/keeper/семей неполный                     | harden, operate                  | **важно** (процесс) | fixture/compose в CI                                |

---

## Исправления в этом PR (safe fixes)

- `src/styles/globals.css` — `a:focus-visible` ring через токен `--color-ring`.
- `PublicAuthLayout` — dev-badge без gateway-jargon.
- `OnboardingDeviceForm` — человекочитаемое описание SMS вместо backend-терминов.
- `FamilyCard` — `truncate` + `title` для имени и pulse; заглушка «Открыть семью» без ложной ссылки.
- `StepShell` — сужен transition прогресс-бара.
- `dialog.tsx` — close control 44px touch + `focus-visible`.
- `DelegateApprovalCard` — человекочитаемые платформы вместо сырого `platform`.

---

## План (не в scope PR)

- Единый словарь CTA: один глагол на тип действия (отправка кода / подтверждение OTP / переход дальше) — вынести в `messages/ru.json`.
- Mobile hero: короткий calm-блок под `BrandMark` (1 строка из desktop h1) без второй карточки.
- Прогресс-бар: перейти на `transform: scaleX` вместо animating width (GPU, Emil #7).
- Storybook/fixture routes или MSW **только dev** для pipeline-screenshots mid-flow (без новых prod deps — опционально Playwright + compose).
- App shell (`/families`, invites CRUD): повтор audit после auth-fixture; `operate` для таблиц/empty states.

---

## Скриншоты

| Viewport         | Каталог                                                              |
| ---------------- | -------------------------------------------------------------------- |
| Desktop 1280×800 | `/opt/cursor/artifacts/design-pipeline-screenshots/desktop/*.png`    |
| Mobile 390×844   | `/opt/cursor/artifacts/design-pipeline-screenshots/mobile-390/*.png` |
| Манифест URL     | `/opt/cursor/artifacts/design-pipeline-screenshots/manifest.json`    |

---

## Findings по экранам

Теги skills: **U** = ui-ux-pro-max, **I** = impeccable, **M** = motion (Emil), **F** = frontend-design/copy.  
Приоритет: **К** критично, **В** важно, **Ж** желательно.

### Корень и вход

#### `/` → `/login` (slug `root`, `login`)

| Pri | Skill     | Finding                                                                                            |
| --- | --------- | -------------------------------------------------------------------------------------------------- |
| В   | U         | Focus ring на текстовых ссылках («Забыли пароль», footer) — было без ring → fix global.            |
| Ж   | F         | Mobile: нет иллюстрации и feature-list с desktop — ощущение «узкой формы».                         |
| Ж   | I quieter | Info-box внизу формы плотный текст xs — ok для 152-ФЗ, но можно чуть больше line-height на mobile. |
| Ж   | M         | Hover shadow на карточках семей (не этот экран) — на login motion минимален ✓                      |

### Вход — recovery и лимиты

#### `/login/recovery` (`login-recovery`)

| Pri | Skill   | Finding                                                                                    |
| --- | ------- | ------------------------------------------------------------------------------------------ |
| Ж   | clarify | CTA «Отправить запрос хранителю» vs «Войти» elsewhere — разные конструкции, но глаголы ok. |
| В   | U       | Ссылка «Назад к входу» — touch min-h-11 ✓ после global focus.                              |

#### `/login/recovery/sent`, `/login/recovery/confirm` (редирект на recovery без flow)

| Pri | Skill  | Finding                                                                                    |
| --- | ------ | ------------------------------------------------------------------------------------------ |
| В   | harden | Без flow cookie экраны не достижны — скриншот дублирует recovery; нужен fixture для audit. |

#### `/login/temp-expired`, `/login/too-many` (`login-temp-expired`, `login-too-many`)

| Pri | Skill   | Finding                                                                                             |
| --- | ------- | --------------------------------------------------------------------------------------------------- |
| В   | operate | `ErrorScreen` / rate limit — calm copy ✓; таймер читаем.                                            |
| Ж   | M       | Spinner на keeper-wait — умеренный; проверить reduced-motion (Loader2 spin сжимается global CSS ✓). |

#### `/login/keeper/expired`, `/login/keeper/rejected`

| Pri | Skill   | Finding                                                   |
| --- | ------- | --------------------------------------------------------- |
| Ж   | clarify | Единообразие «Войти снова» vs «Войти» — мелкая полировка. |

#### `/login/verify-*`, `/login/change-password`, `/login/keeper` (без flow → `/login`)

| Pri | Skill  | Finding                                                         |
| --- | ------ | --------------------------------------------------------------- |
| В   | harden | Невозможно оценить OTP/push UI без сессии — gap процесса audit. |

### Онбординг (ключевой — F+I+onboard)

#### `/onboarding/email` (`onboarding-email`) — **единственный устойчивый шаг без flow**

| Pri | Skill   | Finding                                                                                                |
| --- | ------- | ------------------------------------------------------------------------------------------------------ |
| В   | U       | Label + checkbox 152-ФЗ — связаны; нужен focus на ссылке «обработку персональных данных» → fix global. |
| Ж   | clarify | Дублирование «Личная почта» в title и label — distill candidate.                                       |
| Ж   | onboard | Прогресс 1/5 ясен; CTA disabled до consent ✓.                                                          |
| Ж   | F       | Desktop split layout сильный; mobile — см. топ-8.                                                      |

#### `/onboarding/phone` … `/onboarding/done` (редирект на email)

| Pri | Skill   | Finding                                                                                                              |
| --- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| В   | onboard | Цепочка 5 шагов не снимается — audit copy по коду: phone «Отправить SMS-код» vs email «Отправить код» (**Ж** unify). |
| Ж   | M       | OTP shake — displacement; global reduced-motion сжимает ✓; на частом resend допустимо.                               |

#### `/onboarding/device` (код)

| Pri | Skill   | Finding                               |
| --- | ------- | ------------------------------------- |
| В   | clarify | Backend jargon — **исправлено** в PR. |

### Приглашения и delegate

#### `/invite?code=…` (`invite-code`)

| Pri | Skill    | Finding                                                                           |
| --- | -------- | --------------------------------------------------------------------------------- |
| В   | clarify  | Публичный landing — CTA «Войти»; проверить one-verb с onboarding «Создать семью». |
| Ж   | I polish | Карточка центрирована ✓; mobile padding ok.                                       |

#### `/invite/unavailable` (+ `reason=invalid_code`)

| Pri | Skill  | Finding                                                              |
| --- | ------ | -------------------------------------------------------------------- |
| Ж   | harden | Разные reason — тексты из server; визуально `ErrorScreen` pattern ✓. |

#### `/delegate`, `/delegate/unavailable` → login

| Pri | Skill   | Finding                                                                     |
| --- | ------- | --------------------------------------------------------------------------- |
| В   | operate | Keeper approval UI (`DelegateApprovalCard`) не снят — нужна сессия + token. |
| Ж   | clarify | Platform raw string — **исправлено** human labels.                          |

### Юридические и служебные

#### `/help`, `/privacy`, `/terms`

| Pri | Skill         | Finding                                                                                |
| --- | ------------- | -------------------------------------------------------------------------------------- |
| Ж   | I craft-floor | Длинные тексты — typography `text-sm` ok; проверить max-width на desktop (читаемость). |
| Ж   | U             | Skip link только в `AppShell` — на public legal pages нет skip ( **Ж** ).              |

#### `/forbidden`, `/session-ended`

| Pri | Skill   | Finding                                         |
| --- | ------- | ----------------------------------------------- |
| Ж   | clarify | CTA «Войти» / «Войти снова» — словарь см. план. |

### App (в прогоне = login redirect)

#### `/families`, `/families/new`, `/invites`, `/invites/unavailable`

| Pri | Skill    | Finding                                                            |
| --- | -------- | ------------------------------------------------------------------ |
| В   | operate  | Не аудирован shell/sidebar/table — требуется auth fixture.         |
| В   | break-ui | `FamilyCard` overflow — **исправлено** (код готов к списку семей). |

#### `/dev/kit` (`dev-kit`)

| Pri | Skill       | Finding                                                                |
| --- | ----------- | ---------------------------------------------------------------------- |
| Ж   | craft-floor | Витрина соответствует DESIGN.md ✓; использовать для регрессии токенов. |

---

## frontend-design (ключевые экраны — резюме)

- **Login:** спокойная карточка, primary h-12, без buzzwords; slug field с `@workspaces.carelink.app` — технический suffix ok для power users, для старших можно подсказку plain-language (**Ж**).
- **Onboarding email:** consent above submit — правильный порядок; tone «Спокойная забота» ✓.
- **Invite landing:** минималистично; не перегружать вторичными CTA (**distill**).

---

## Motion (Emil) — резюме

- Global `prefers-reduced-motion` в `globals.css` ✓.
- Риски: `AppMobileNav` slide (частота), `FamilyCard` hover shadow (desktop, gated hover ok), `StepShell` width transition (**смягчено**).
- OTP shake — единственный expressive motion на шаге ошибки — допустимо по Carelink Modified.

---

## Доказательства

| Утверждение                                      | Тип               |
| ------------------------------------------------ | ----------------- |
| Pipeline skills прочитаны из CarelinkMemory main | static read       |
| search.py выполнен (focus, touch, forms, nextjs) | live run          |
| 74 скриншота, manifest.json                      | live run          |
| lint/typecheck/test/build                        | live run (см. CI) |
