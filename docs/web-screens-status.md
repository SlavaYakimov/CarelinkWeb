# Carelink Web — статус экранов Stitch (01–40)

Источник макетов: `docs/stitch-ref/export/` (HTML/PNG из Google Stitch, `DESIGN.md`, `IMPLEMENTATION.md`, `flow.md`).

**Исключены из v1 (продукт):** экраны **24** «Вступление по коду», **26** «Ожидание хранителя (pairing)», **25** «Вступление — телефон и имя» (только поток join-by-code / pairing — **не реализуем**).

**Контракт API в репозитории:** `contracts/auth.openapi.yaml` (синхронизация с CarelinkAuth gateway). Если эндпоинта нет в OpenAPI — считаем **пробел backend** для UI.

**Легенда реализации:** ✅ готово · 🟡 частично · ⬜ нет · 🚫 пропуск v1

| №   | Экран                                  | Маршрут (целевой)           | Статус  | API (нужно)                           | API в OpenAPI                                               |
| --- | -------------------------------------- | --------------------------- | ------- | ------------------------------------- | ----------------------------------------------------------- |
| 01  | Вход — Workspace                       | `/login`                    | ✅      | POST `/v2/auth/workspace/sign-in`     | ✅                                                          |
| 02  | Неверный пароль                        | `/login` (состояние)        | 🟡      | тот же → 401                          | ✅                                                          |
| 03  | Слишком много попыток                  | `/login/too-many`           | ✅      | 429                                   | ✅                                                          |
| 04  | Временный пароль истёк                 | `/login/temp-expired`       | ✅      | TEMP_PASSWORD_EXPIRED                 | ✅                                                          |
| 05  | Смена временного пароля                | `/login/change-password`    | ✅      | POST `…/password/change`              | ✅                                                          |
| 06  | Подтверждение устройства — push        | `/login/verify-push`        | 🟡      | request/resend push-verify            | ✅                                                          |
| 07  | SMS-код устройства                     | `/login/verify-sms`         | ✅      | request-sms / verify-sms / complete   | ✅                                                          |
| 08  | Подтверждение телефона (sign-in/start) | `/login/verify-phone`       | ✅      | start, request-otp, verify-phone      | ✅                                                          |
| 09  | Вход через хранителя — ожидание        | `/login/keeper`             | ✅      | delegate-push, polling                | ✅                                                          |
| 10  | Хранитель: подтвердить вход            | `/delegate`                 | ✅      | delegate-details, approve/reject      | ✅                                                          |
| 11  | Онбординг — почта                      | `/onboarding/email`         | ⬜ → PR | onboarding email request/verify       | ✅                                                          |
| 12  | Онбординг — телефон                    | `/onboarding/phone`         | ⬜ → PR | onboarding phone OTP                  | ✅                                                          |
| 13  | Онбординг — устройство                 | `/onboarding/device`        | ⬜ → PR | device register + onboarding verify   | ✅ (web platform — см. BE)                                  |
| 14  | Онбординг — пароль                     | `/onboarding/password`      | ⬜ → PR | password/setup                        | ✅                                                          |
| 15  | Онбординг — адрес семьи                | `/onboarding/workspace`     | ⬜ → PR | workspace/finalize                    | ✅                                                          |
| 16  | Семья создана                          | `/onboarding/done`          | ⬜ → PR | — (данные finalize)                   | —                                                           |
| 17  | Пригласить участника                   | `/families/.../invites/new` | ⬜      | member-invites + lookup + avatar      | ❌                                                          |
| 18  | Приглашение отправлено (новый)         | —                           | ⬜      | member-invites 201                    | ❌                                                          |
| 19  | Приглашение отправлено (existing)      | —                           | ⬜      | member-invites                        | ❌                                                          |
| 20  | Приглашения семьи — список             | `/invites`                  | ⬜      | GET `…/member-invites`                | ❌                                                          |
| 21  | Входящие приглашения                   | `/invites/incoming`         | ⬜      | GET `/v1/user/member-invites/pending` | ❌                                                          |
| 22  | Приглашение недоступно                 | `/invites/unavailable`      | ⬜      | accept errors                         | ❌                                                          |
| 23  | Приглашение по ссылке                  | `/invite`                   | ⬜      | resolve invite by code (не pair)      | ❌                                                          |
| 24  | Вступление по коду                     | —                           | 🚫      | pair/resolve                          | ✅ (UI v1 нет)                                              |
| 25  | Вступление телефон и имя               | —                           | 🚫      | pair/*                                | ✅ (UI v1 нет)                                              |
| 26  | Ожидание хранителя (pair)              | —                           | 🚫      | pair/approval-status                  | ✅ (UI v1 нет)                                              |
| 27  | Заявки на вступление                   | `/requests/join`            | ⬜      | pair/approve, pair/reject (list?)     | 🟡 (approve/reject есть, **list заявок в OpenAPI web нет**) |
| 28  | Нет прав хранителя                     | `/forbidden`                | ✅      | —                                     | —                                                           |
| 29  | Восстановление — запрос                | `/login/recovery`           | ⬜ → PR | POST `/v2/auth/recovery/request`      | ✅                                                          |
| 30  | Восстановление — новый пароль          | `/login/recovery/confirm`   | ⬜ → PR | POST `/v2/auth/recovery/confirm`      | ✅                                                          |
| 31  | Хранитель: восстановление              | `/recovery/[id]`            | ⬜      | GET/POST `/v1/recovery-requests/…`    | ❌                                                          |
| 32  | Аккаунт заблокирован                   | `/login/blocked`            | ⬜      | refresh 401 lock                      | 🟡                                                          |
| 33  | Главная — мои семьи                    | `/families`                 | ⬜ → PR | GET `/v1/user/families`               | ✅                                                          |
| 34  | Семья — участники                      | `/families/[id]/members`    | ⬜      | members, role-templates, unlock       | ❌                                                          |
| 35  | Создать семью                          | `/families/new`             | ⬜ → PR | POST `/v1/families`                   | ✅ (slug в макете — **нет в CreateFamilyRequest**)          |
| 36  | Журнал безопасности                    | `/families/[id]/security`   | ⬜      | GET `…/security-audit`                | ❌                                                          |
| 37  | Профиль и аватар                       | `/profile`                  | ⬜      | PATCH `/v1/user/me`, avatar           | ✅                                                          |
| 38  | Устройства и сессии                    | `/devices`                  | ⬜      | GET/DELETE `/v2/auth/devices`, logout | ✅                                                          |
| 39  | Уведомления                            | `/notifications`            | ⬜      | сводка (без Web Push v1)              | 🟡                                                          |
| 40  | Сессия завершена                       | `/session-ended`            | ✅      | refresh 401                           | ✅                                                          |

## Уже соблюдено в коде (main)

- BFF, сессия Redis, TTL: `SESSION_IDLE_TTL=7d`, `SESSION_ABSOLUTE_TTL=30d`, гость `SESSION_GUEST_TTL=12h` (`src/env.ts`).
- Обёртки `withServerAction` / `withRouteHandler` + тест покрытия.
- Продуктовая чистка: нет invite-кода на логине, нет маркетинговых обещаний шифрования (`tests/components/product-ui-copy.test.tsx`).
- `/delegate`: устройство + время, без города/IP; «в сети» в UI не показывается.

## План PR (очередь)

1. **Gap analysis** — этот файл + ссылка на Stitch export.
2. **App shell + 33 + 35** — сайдбар/топбар, список семей, создание семьи (`POST /v1/families`).
3. **29–30 Восстановление** — публичные формы request/confirm.
4. Онбординг 11–16, приглашения 17–23, 27, 31–32, 34, 36–39 — по мере появления эндпоинтов в OpenAPI / backend.

## Пробелы backend / OpenAPI (блокируют полный UI)

| Область               | Что нужно UI                  | Статус в `auth.openapi.yaml`                                         |
| --------------------- | ----------------------------- | -------------------------------------------------------------------- |
| Member invites        | 17–23, 20, 21                 | Нет `/v1/families/{id}/member-invites`, lookup, pending user invites |
| Join requests list    | 27 (без «Код K7P-42Q»)        | Нет list pending pair/join requests для хранителя                    |
| Recovery keeper       | 31                            | Нет `/v1/recovery-requests/{id}` approve/reject/lock                 |
| Security audit        | 36 (без IP/города)            | Нет `/v1/families/{id}/security-audit`                               |
| Family members        | 34                            | Нет list members / unlock в web-контракте                            |
| Create family slug    | 35 макет «адрес @workspaces…» | `CreateFamilyRequest` только `name` (+ unionRole)                    |
| Notifications feed    | 39 (сводка, без push)         | Нет REST feed; только push register                                  |
| Invite deep link      | 23                            | Нет публичного resolve invite code (не pair)                         |
| Web onboarding device | 13                            | `platform` ios/android в register — web может требовать BE           |

Обновлять таблицу по мере мержа PR и `pnpm contracts:sync`.
