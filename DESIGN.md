# Carelink Web — дизайн-система

Единый источник правды по визуальному языку и UI-паттернам фронтенда. Описано **только то, что уже есть в репозитории**; новые токены не придумываем — сначала правка `src/styles/globals.css`, затем этот документ и `tests/unit/contrast-tokens.test.ts`.

Живая витрина (только `development`): маршрут `/dev/kit` (`src/app/dev/kit/DevKitShowcase.tsx`).

---

## 1. Токены (`src/styles/globals.css`)

Токены объявлены в блоке `@theme` (Tailwind CSS v4). В компонентах используются как семантические классы Tailwind: `bg-primary`, `text-muted-foreground`, `border-border`, `rounded-[var(--radius-md)]`, `shadow-[var(--shadow-card)]` и т.д.

### 1.1. Светлая тема (единственная в коде)

Отдельных токенов для тёмной темы, класса `.dark` и `prefers-color-scheme: dark` в `globals.css` **нет**. Интерфейс рассчитан на светлую палитру ниже.

| Токен                            | Hex       | Назначение в UI                                              |
| -------------------------------- | --------- | ------------------------------------------------------------ |
| `--color-background`             | `#f7faf8` | Фон страницы (`body`, shell)                                 |
| `--color-foreground`             | `#14201b` | Основной текст                                               |
| `--color-card`                   | `#ffffff` | Карточки, поля ввода, popover                                |
| `--color-card-foreground`        | `#14201b` | Текст на карточке                                            |
| `--color-popover`                | `#ffffff` | Popover                                                      |
| `--color-popover-foreground`     | `#14201b` | Текст popover                                                |
| `--color-primary`                | `#1f5c4a` | Главный акцент: кнопки, фокус, прогресс, контейнер логотипа  |
| `--color-primary-foreground`     | `#ffffff` | Текст/иконка на primary                                      |
| `--color-secondary`              | `#8a6a3b` | Вторичный акцент (подзаголовок бренда, декоративные акценты) |
| `--color-secondary-foreground`   | `#ffffff` | Текст на secondary (если залит фон secondary)                |
| `--color-muted`                  | `#eef3f0` | Приглушённые поверхности, прогресс-бар «дорожка»             |
| `--color-muted-foreground`       | `#4a5650` | Вторичный текст, подписи, footer                             |
| `--color-accent`                 | `#dcefe6` | Hover ghost-кнопок, success-alert фон                        |
| `--color-accent-foreground`      | `#0b3726` | Текст на accent                                              |
| `--color-destructive`            | `#b3261e` | Ошибки, destructive-кнопки                                   |
| `--color-destructive-foreground` | `#ffffff` | Текст на destructive                                         |
| `--color-border`                 | `#c3ccc7` | Границы карточек, разделители                                |
| `--color-input`                  | `#8a958f` | Граница полей ввода                                          |
| `--color-ring`                   | `#1f5c4a` | Focus ring (совпадает с primary)                             |
| `--color-info`                   | `#3e5f7a` | Информационные акценты                                       |
| `--color-info-foreground`        | `#ffffff` | Текст на info                                                |
| `--color-info-muted`             | `#e3eef7` | Фон info-alert                                               |
| `--color-success`                | `#2e7d4f` | Индикаторы успеха (точки статуса)                            |
| `--color-success-foreground`     | `#ffffff` | Текст на success                                             |
| `--color-warning`                | `#a86200` | Предупреждения                                               |
| `--color-warning-foreground`     | `#8a5000` | Текст на warning-muted                                       |
| `--color-warning-muted`          | `#fff4e0` | Фон warning-alert                                            |
| `--color-error-muted`            | `#fce8e6` | Фон destructive-alert                                        |

Контраст ключевых пар проверяется в `tests/unit/contrast-tokens.test.ts` (hex дублируют `@theme`).

### 1.2. Типографика

| Токен / правило  | Значение                                   |
| ---------------- | ------------------------------------------ |
| `--font-sans`    | `var(--font-inter)`, system-ui, sans-serif |
| `--font-heading` | `var(--font-manrope)`, затем sans          |

Подключение шрифтов: `src/lib/fonts.ts` (self-hosted woff2 в `public/fonts/`).

| Семейство | Начертания в репо | Роль                                                    |
| --------- | ----------------- | ------------------------------------------------------- |
| Inter     | 400, 500          | `body`, UI, поля (`font-sans`)                          |
| Manrope   | 600, 700          | `h1`–`h4`, заголовки карточек и бренда (`font-heading`) |

Базовые правила (`@layer base`):

- `body`: `bg-background text-foreground font-sans antialiased`
- `h1`, `h2`, `h3`, `h4`: `font-family: var(--font-heading)`

**Фактические размеры в компонентах** (отдельных typography-токенов в CSS нет):

| Класс                      | Где встречается                                         |
| -------------------------- | ------------------------------------------------------- |
| `text-xs`                  | Подпись бренда «Спокойная забота», footer, бейджи, шаги |
| `text-sm`                  | Label, описания, основной вторичный текст               |
| `text-base`                | Поля ввода (`Input`)                                    |
| `text-lg` / `text-xl`      | Заголовки карточек, названия семей                      |
| `text-2xl`                 | Заголовки auth-форм в `CardTitle`                       |
| `text-3xl` / `md:text-4xl` | Маркeting-заголовок в `PublicAuthLayout`                |

### 1.3. Скругления

| Токен         | Значение          |
| ------------- | ----------------- |
| `--radius-sm` | `0.625rem` (10px) |
| `--radius-md` | `0.75rem` (12px)  |
| `--radius-lg` | `0.75rem`         |
| `--radius-xl` | `1rem` (16px)     |

Использование: кнопки и инпуты — `radius-md`; карточки — `radius-lg`; иллюстрации и feature-блоки — `rounded-xl` (Tailwind, не отдельный токен).

### 1.4. Тени

| Токен           | Значение                       |
| --------------- | ------------------------------ |
| `--shadow-card` | `0 1px 2px rgb(20 32 27 / 6%)` |

В разметке также встречается утилита `shadow-card` (если настроена в теме Tailwind) и явно `shadow-[var(--shadow-card)]` в `Card` и инпутах.

### 1.5. Отступы и сетка

**Отдельных spacing-токенов в `@theme` нет** — используется шкала Tailwind по умолчанию. Повторяющиеся паттерны в коде:

| Паттерн                      | Типичное применение                                       |
| ---------------------------- | --------------------------------------------------------- |
| `max-w-[440px]`              | Auth-формы, `StepShell`, `ErrorScreen`                    |
| `max-w-6xl` + `px-4 md:px-8` | `PublicAuthLayout`                                        |
| `p-6` / `pt-0`               | `CardHeader` / `CardContent`                              |
| `space-y-4`                  | Формы внутри карточки                                     |
| `space-y-2`                  | `FormField`                                               |
| `space-y-6`                  | `StepShell`                                               |
| `gap-3`                      | `BrandMark`, feature-строки                               |
| `h-12`                       | Кнопки (`default`), поля ввода — минимальная зона нажатия |
| `min-h-11`                   | Ссылки footer, icon-кнопки                                |

### 1.6. Движение и доступность

- `@media (prefers-reduced-motion: reduce)` — анимации и transitions сжимаются до минимума.
- `@keyframes otp-shake` — лёгкое покачивание при ошибке OTP (используется в OTP-компонентах).
- Focus: `focus-visible:ring-[3px] focus-visible:ring-ring` на интерактивных элементах (`Button`, `Input`).
- Skip-link «К содержимому» в `AppShell`.

---

## 2. Логотип (филин)

### 2.1. Файлы

| Путь                                 | Назначение                                       |
| ------------------------------------ | ------------------------------------------------ |
| `public/brand/owl.svg`               | Исходный SVG-актив (viewBox `0 0 512 512`)       |
| `src/components/brand/owl-mark.tsx`  | Общая геометрия `OwlMarkPaths` (синхронна с SVG) |
| `src/components/brand/Logo.tsx`      | Inline SVG для React, `currentColor`             |
| `src/components/brand/BrandMark.tsx` | Логотип + wordmark «Carelink» + слоган           |

### 2.2. Минимальные размеры (из `BrandMark`)

| Режим     | Контейнер иконки   | SVG внутри |
| --------- | ------------------ | ---------- |
| Обычный   | `size-10` (2.5rem) | `size-6`   |
| `compact` | `size-9`           | `size-5`   |

Контейнер: `rounded-lg bg-primary text-primary-foreground`, иконка центрируется flex.

### 2.3. Воздух (clear space)

В `BrandMark` между блоком иконки и текстом — `gap-3` (0.75rem). При размещении рядом с другими элементами сохраняйте как минимум такой же зазор до посторонней графики и краёв.

### 2.4. Где используется

- `PublicAuthLayout` — полный и `compact` на мобильных
- `AppSidebar` — `BrandMark compact`
- Тесты: `tests/components/logo.test.tsx`, `cypress/e2e/brand-logo.cy.ts`

### 2.5. Доступность

- Standalone `Logo`: `role="img"`, `aria-label="Carelink"`.
- В составе `BrandMark` у `Logo` — `aria-hidden` (название читается из текста «Carelink»).

### 2.6. Чего не делать

- **Не** подменять филина символом «дом» (`⌂`) или другим пиктogram — регрессия отслеживается e2e.
- **Не** менять пропорции viewBox `512×512` и силуэт из `OwlMarkPaths` / `owl.svg`.
- **Не** растягивать SVG без сохранения квадратного контейнера (`size-*` на обёртке и иконке).
- Для UI предпочитать компоненты `Logo` / `BrandMark`, а не дублировать path вручную (риск рассинхрона с `public/brand/owl.svg`).
- Цвет знака в продукте — через `currentColor` на primary-фоне в `BrandMark`; не заливать произвольными hex в обход токенов.

---

## 3. Компоненты (`src/components`)

### 3.1. Структура каталогов

```
src/components/
  brand/      — логотип и wordmark
  ui/         — примитивы (shadcn-стиль): Button, Card, Input, Label, Alert, Dialog, Checkbox, Sonner
  carelink/   — доменные экраны, формы, shell, хуки (usePhoneField, useResendCountdown, …)
```

Импорты: `@/components/...`, утилита `cn` из `@/lib/utils`.

### 3.2. Примитивы `ui/`

- **Button** (`button.tsx`): варианты `default | secondary | ghost | destructive | link`; размеры `default | sm | lg | icon`; prop `loading` с `Loader2`; CVA + Radix `Slot` для `asChild`.
- **Card** (`card.tsx`): `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` — border, `shadow-card`, padding `p-6`.
- **Input** (`input.tsx`): высота `h-12`, `aria-invalid` → destructive border/ring.
- **Alert** (`alert.tsx`): варианты `default | info | success | warning | destructive`; `role="alert"`.
- **Label** (`label.tsx`): Radix Label, `text-sm font-medium`.

### 3.3. Паттерны `carelink/`

| Область               | Компоненты / соглашения                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Публичный auth        | `PublicAuthLayout` — двухколоночная сетка на `lg`, форма справа                                                                                |
| Пошаговые сценарии    | `StepShell` — прогресс, «Назад», заголовок; контент формы ниже                                                                                 |
| Формы                 | Одна **внешняя** `Card` на экран (`max-w-[440px]`), внутри `form` + `FormField` + доменные поля (`PhoneInput`, `OtpInput`, `PasswordField`, …) |
| Ошибки                | `FormAlert`, `FieldError`, коды из `messages/ru.json` через сервер                                                                             |
| Приложение            | `AppShell` + `AppSidebar` / `AppTopBar` / `AppMobileNav`                                                                                       |
| Юридические черновики | `LegalDraftNotice` — warning-alert «Черновик для юристов»                                                                                      |

Клиентские формы: см. [`.cursor/rules/forms.mdc`](.cursor/rules/forms.mdc) (состояние, OTP, zod на сервере).

### 3.4. Иконки

Lucide React (`lucide-react`), в кнопках по умолчанию `size-4`, `aria-hidden` на декоративных.

---

## 4. Голос и тон (copy)

Ориентиры — тексты в `PublicAuthLayout`, слоган в `BrandMark` (**«Спокойная забота»**), сообщения об ошибках в `messages/ru.json`, формулировки согласий в онбординге (`OnboardingEmailForm`).

### 4.1. Принципы

- **Спокойно и по делу** — без восклицаний, кликбейта и «продающего» давления.
- **Доверие и семья** — «семейный круг», «близкие», «хранитель», забота о старших; медицинский контекст (лекарства, здоровье) без запугивания.
- **Честность при сбоях** — «Попробуйте позже», «Сервис временно недоступен», конкретные шаги («Войдите снова», «Запросите новый код»).
- **Без лишних ПДн в UI** — не показывать и не просить больше данных, чем нужно шагу; тексты ошибок не дублируют чувствительные значения полей.

### 4.2. 152-ФЗ и юридический контекст

- Пользовательские тексты о персональных данных и здоровье — только согласованные формулировки (см. `src/app/(public)/privacy/page.tsx`, чекбокс в онбординге).
- Черновики политик помечаются `LegalDraftNotice`; не выдавать черновик за финальную редакцию.
- В маркетинговых блоках auth — акцент на **закрытый контур семьи**, отсутствие рекламы и сторонних трекеров (как в feature-текстах layout), без обещаний, которых нет в продукте.
- UI-копирайт **не заменяет** юридические документы; ссылки «Конфиденциальность» / «Условия» в footer auth.

### 4.3. Локализация

Строки ошибок и валидации централизуются в `messages/ru.json` (`errors.*`, `validation.*`). Новые коды ошибок — сначала locale, потом UI.

---

## 5. Антипаттерны

Не добавлять в новые экраны без явного решения продукта:

| Антипаттерн                                                                                    | Почему                                                                                                  |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Gradient text** (`bg-clip-text`, радужные заголовки)                                         | Нет в текущей палитре и компонентах; ухудшает спокойный медицинско-семейный тон и контраст              |
| **Вложенные карточки** (`Card` внутри `Card`)                                                  | Auth и формы используют **одну** карточку на экран; вложенность создаёт визуальный шум и лишние границы |
| **Маркетинговые buzzwords** («революция», «AI-powered», «х10 продуктивность», «best-in-class») | Противоречит фактическому тону интерфейса и 152-ФЗ-friendly подаче                                      |
| **Символ дома вместо филина**                                                                  | Явно исключено тестами бренда                                                                           |
| **Случайные hex вне `@theme`**                                                                 | Ломает контраст-тесты и единообразие                                                                    |
| **Клиентские «глобальные» сторы для текста ошибок**                                            | Дублирование server state; см. rules форм                                                               |

---

## 6. Связанные файлы

| Файл                                 | Роль                                      |
| ------------------------------------ | ----------------------------------------- |
| `src/styles/globals.css`             | Токены `@theme`                           |
| `src/lib/fonts.ts`                   | Self-hosted шрифты                        |
| `tests/unit/contrast-tokens.test.ts` | WCAG-контраст токенов                     |
| `messages/ru.json`                   | Тексты ошибок                             |
| `.cursor/rules/forms.mdc`            | Правила форм                              |
| `docs/PLAN.md`                       | Продуктовый план, в т.ч. 152-ФЗ и хостинг |

При изменении токенов: обновить `globals.css`, этот файл, hex в `contrast-tokens.test.ts` и при необходимости swatches в `DevKitShowcase`.
