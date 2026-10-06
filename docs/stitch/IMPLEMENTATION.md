# Carelink Web — руководство по реализации экранов

Документ для реализации веб-приложения Carelink по макетам Google Stitch (проект «Carelink Web», id `14827692815693858895`, https://stitch.withgoogle.com/projects/14827692815693858895).
Связанные файлы: `flow.md` (карта экранов), `flow.mmd` (mermaid-схема), `DESIGN.md` (дизайн-система «Тихая забота»), `screens/NN.png` (скриншоты), `html/NN.html` (HTML/Tailwind-экспорт Stitch — удобно как стартовая разметка), `overview.png` (контакт-лист).

Источник API: /workspace/carelink-guide (REST `/v1`, `/v2`, gRPC, GraphQL). Все запросы — JSON; защищённые — `Authorization: Bearer <family access JWT>`; мутирующие — заголовок `Idempotency-Key` (UUID на попытку пользователя).

## Предлагаемый стек (кратко)

- **React 19 + TypeScript + Vite** (или Next.js App Router, если нужен SSR для публичных страниц `/invite`, `/verify`).
- **Маршрутизация:** React Router / Next routes; группы `(public)` — вход, онбординг, восстановление, приглашение по ссылке; `(app)` — layout с сайдбаром и топбаром, guard по наличию сессии.
- **Данные:** TanStack Query (кэш, повторы, polling для 06/09/26), клиент из `openapi.yaml` (openapi-typescript + openapi-fetch); GraphQL-подписки (graphql-ws) для статусов заявок и уведомлений, если включены.
- **Формы:** React Hook Form + Zod (пароль ≥ 8, slug 3–32 `[a-z0-9-]`, телефон E.164, OTP 4/6 цифр).
- **UI:** Tailwind CSS с токенами из `DESIGN.md` (primary #1F5C4A, secondary #8A6A3B, tertiary #3E5F7A, error #B3261E), шрифты Manrope/Inter (cyrillic subset), Radix UI / shadcn для диалогов, тостов, табов; иконки Lucide.
- **Сессия:** access JWT в памяти, refresh — httpOnly cookie через BFF или в защищённом хранилище; single-flight `POST /v1/auth/token/refresh` с ротацией; при reuse/401 → экран 40. `deviceId` — UUID, генерируется один раз и хранится в `localStorage`.
- **Web Push:** Service Worker + VAPID; подписка передаётся при регистрации устройства (`deviceRegistrationToken`).
- **i18n:** все строки на русском, вынесены в словарь (i18next) для будущих языков; форматы дат/телефонов — `Intl` ru-RU.
- **Качество:** Playwright e2e по 16 сценариям из гайда, MSW-моки API для состояний ошибок (429, 401 TEMP_PASSWORD_EXPIRED, 403 KEEPER_NOT_FOUND и т. д.), axe для доступности (WCAG AA).

## Общие состояния и обработка ошибок

| Код                                                                                | Где                    | Поведение UI                                                           |
| ---------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `INVALID_CREDENTIALS` 401                                                          | 01, 05                 | экран/баннер 02, один текст для неверного пароля и отсутствия членства |
| `RATE_LIMIT` 429                                                                   | любые auth/OTP         | экран 03 или inline-таймер (Retry-After)                               |
| `TEMP_PASSWORD_EXPIRED` 401                                                        | 01, 05                 | экран 04                                                               |
| приглашение использовано / истекло / адресовано другому (accept → 400 / 403 / 404) | 21, 23, 24             | экран 22                                                               |
| `KEEPER_NOT_FOUND` / `UNAUTHORIZED` 401 / `FORBIDDEN` 403 «keeper required»        | 10, 27, 31, 34         | экран 28                                                               |
| аккаунт заблокирован хранителем (recovery lock: sign-in/refresh → 401)             | вход, refresh          | экран 32                                                               |
| refresh → 401 `UNAUTHORIZED` / `TOKEN_EXPIRED` (reuse, отзыв)                      | любой защищённый       | экран 40                                                               |
| `*_UNDELIVERED` 503                                                                | SMS/push/email         | inline-баннер «Не удалось отправить» + повтор                          |
| загрузка                                                                           | списки                 | скелетоны карточек; кнопки — спиннер внутри, disabled                  |
| пусто                                                                              | 20, 21, 27, 36, 38, 39 | иллюстрация + пояснение + основное действие                            |

## A. Вход через Workspace (scn-ws-signin, scn-otp, scn-device)

### 01 Вход — Workspace

- **Макет Stitch:** screen `66100fb82b764df5915347f2a8a4f959` · `screens/01.png` · `html/01.html`
- **Назначение:** Единственный вход: workspace-логин семьи + личный пароль. Ссылки на восстановление, код приглашения, создание семьи.
- **API:** POST /v2/auth/workspace/sign-in {workspaceEmail, password, deviceId}
- **Состояния:** default; loading (спиннер в кнопке); ошибки → 02/03/04; валидация: пароль ≥ 8, deviceId 8–128 (генерируется браузером и хранится в localStorage)
- **Переходы:** → 33 «Главная — мои семьи» (flow=shortcut → session); → 06 «Подтверждение устройства — push» (flow=full, verificationChannel=push); → 07 «Подтверждение устройства — SMS-код» (flow=full, verificationChannel=sms); → 05 «Смена временного пароля» (requiresPasswordChange=true); → 02 «Вход — неверный пароль» (INVALID_CREDENTIALS 401); → 03 «Вход — слишком много попыток» (RATE_LIMIT 429); → 04 «Временный пароль истёк» (TEMP_PASSWORD_EXPIRED 401); → 29 «Восстановление — запрос» (Забыли пароль); → 24 «Вступление по коду» (Есть код приглашения); → 11 «Онбординг — почта» (Создать семью)

### 02 Вход — неверный пароль

- **Макет Stitch:** screen `59d62061899b49629d9cbe041c5850b4` · `screens/02.png` · `html/02.html`
- **Назначение:** Состояние ошибки входа. Один и тот же текст для неверного пароля и отсутствия членства (сервер не раскрывает причину).
- **API:** POST /v2/auth/workspace/sign-in → 401 INVALID_CREDENTIALS; 404 WORKSPACE_NOT_FOUND (ошибка под полем логина)
- **Состояния:** error banner, поле пароля в ошибке, счётчик попыток (клиентский)
- **Переходы:** → 01 «Вход — Workspace» (повторить); → 29 «Восстановление — запрос» (восстановить через семью); → 03 «Вход — слишком много попыток» (лимит исчерпан)

### 03 Вход — слишком много попыток

- **Макет Stitch:** screen `5958529ae0bd45428f6920e5e6f3f612` · `screens/03.png` · `html/03.html`
- **Назначение:** Rate limit входа/OTP/смены пароля. Таймер до повтора (Retry-After, если есть).
- **API:** любой auth-маршрут → 429 RATE_LIMIT
- **Состояния:** warning; таймер; кнопка disabled до 00:00
- **Переходы:** → 01 «Вход — Workspace» (таймер истёк); → 29 «Восстановление — запрос» (восстановление)

### 06 Подтверждение устройства — push

- **Макет Stitch:** screen `cd2a497b06a54522864ecaa3120a1bb8` · `screens/06.png` · `html/06.html`
- **Назначение:** Ожидание подтверждения входа по push-ссылке на зарегистрированном устройстве (loading state).
- **API:** POST /v2/auth/workspace/sign-in/request-push-verify {challengeId, deviceId}; /resend-push-verify; ссылка GET …/verify-link?token= → deviceSession; затем POST …/sign-in/complete (X-Device-Session)
- **Состояния:** loading/ожидание с таймером повторной отправки; ошибки DEVICE_REGISTRATION_REQUIRED 403 → 07 (SMS), DEVICE_VERIFY_UNDELIVERED 503, INVALID_OTP (ссылка использована)
- **Переходы:** → 33 «Главная — мои семьи» (verified → complete → session); → 07 «Подтверждение устройства — SMS-код» (Получить код по SMS); → 09 «Вход через хранителя — ожидание» (Попросить хранителя); → 05 «Смена временного пароля» (complete → requiresPasswordChange)

### 07 Подтверждение устройства — SMS-код

- **Макет Stitch:** screen `60f636d42e4e46e2b83713b7f4bfc7a6` · `screens/07.png` · `html/07.html`
- **Назначение:** Резервный путь подтверждения устройства 6-значным SMS-кодом.
- **API:** POST /v2/auth/workspace/sign-in/request-sms {challengeId, deviceId, phone}; POST …/verify-sms {…, code} → deviceSession; POST …/sign-in/complete
- **Состояния:** ячейки OTP; таймер повторной отправки; INVALID_OTP 400 (после 5 попыток — блок), RATE_LIMIT 429, SMS_UNDELIVERED 503, NOT_IMPLEMENTED 501
- **Переходы:** → 33 «Главная — мои семьи» (успех → session); → 05 «Смена временного пароля» (requiresPasswordChange); → 03 «Вход — слишком много попыток» (429)

### 08 Подтверждение телефона (verify-phone)

- **Макет Stitch:** screen `10b2f68fd1e34078ae07dc23071b330b` · `screens/08.png` · `html/08.html`
- **Назначение:** Проверка телефона после ввода логина/пароля (путь sign-in/start → request-otp → verify-phone), пользователь должен состоять в семье.
- **API:** POST /v2/auth/workspace/sign-in/start {workspaceEmail, deviceId}; POST …/request-otp {challengeId, phone}; POST …/verify-phone {challengeId, phone, code}; далее устройство (06/07) и /sign-in/complete
- **Состояния:** ввод телефона (+7, нормализация 8XXX→+7); OTP; INVALID_OTP, INVALID_CREDENTIALS (телефон не принадлежит), RATE_LIMIT, SMS_UNDELIVERED
- **Переходы:** → 06 «Подтверждение устройства — push» (phoneVerified → подтверждение устройства); → 33 «Главная — мои семьи» (complete → session); → 03 «Вход — слишком много попыток» (429)

## B. Временный пароль (scn-temp-pw)

### 04 Временный пароль истёк

- **Макет Stitch:** screen `a868a704f2034ebaa3629fd403ca2155` · `screens/04.png` · `html/04.html`
- **Назначение:** Вход с временным паролем старше 72 ч (WORKSPACE_TEMP_PASSWORD_TTL).
- **API:** POST /v2/auth/workspace/sign-in или /password/change → 401 TEMP_PASSWORD_EXPIRED
- **Состояния:** error-state; подсказка попросить хранителя переотправить приглашение
- **Переходы:** → 01 «Вход — Workspace» (вернуться ко входу)

### 05 Смена временного пароля

- **Макет Stitch:** screen `d64ecf2273f24d67925229d1a729341a` · `screens/05.png` · `html/05.html`
- **Назначение:** Первый вход приглашённого: обязательная смена одноразового пароля, без сессии до смены.
- **API:** POST /v2/auth/workspace/password/change {challengeId, oldPassword, newPassword, deviceId} (или Bearer family access) → {session}
- **Состояния:** индикатор силы пароля; ошибки WEAK_PASSWORD 400, INVALID_CREDENTIALS 401 (старый неверный), TEMP_PASSWORD_EXPIRED 401 → 04, RATE_LIMIT 429 (15/ч) → 03, 400 «смена не требуется»
- **Переходы:** → 08 «Подтверждение телефона (verify-phone)» (успех → подтверждение телефона/устройства (если требуется)); → 33 «Главная — мои семьи» (успех + session); → 04 «Временный пароль истёк» (TEMP_PASSWORD_EXPIRED)

## C. Вход с подтверждением от хранителя (scn-delegate)

### 09 Вход через хранителя — ожидание

- **Макет Stitch:** screen `bc8aa511d29f4b148bf08bc142478fc4` · `screens/09.png` · `html/09.html`
- **Назначение:** Участник без доверенного устройства просит хранителя подтвердить вход (pending 5 мин).
- **API:** POST /v2/auth/workspace/sign-in/request-delegate-push {challengeId, deviceId}; затем POST …/sign-in/complete без X-Device-Session
- **Состояния:** loading/ожидание с таймером 5:00; ошибки DELEGATE_NOT_ALLOWED 403 (нет хранителя — KEEPER_NOT_FOUND в UI, gate выключен, истёк)
- **Переходы:** → 33 «Главная — мои семьи» (хранитель подтвердил → session); → 06 «Подтверждение устройства — push» (другой способ); → 01 «Вход — Workspace» (отмена)

### 10 Хранитель: подтвердить вход участника

- **Макет Stitch:** screen `27d7595fb77348f8b58af3fde8a76794` · `screens/10.png` · `html/10.html`
- **Назначение:** Страница по ссылке из push хранителю: кто, какое устройство, когда; подтвердить/отклонить.
- **API:** GET /v2/auth/workspace/sign-in/delegate-link?token= или POST …/approve-delegate {token}
- **Состояния:** success; INVALID_OTP 400 (ссылка использована/истекла); DELEGATE_NOT_ALLOWED 403 (вы не хранитель этой семьи)
- **Переходы:** → 33 «Главная — мои семьи» (готово)

## D. Онбординг хранителя: создание семьи (scn-onboarding, scn-device)

### 11 Онбординг — почта

- **Макет Stitch:** screen `a08d43c43d324f2fa6358c377d6a0843` · `screens/11.png` · `html/11.html`
- **Назначение:** Шаг 1/5: личная почта создателя семьи, код XXX-XXX или ссылка из письма.
- **API:** POST /v2/auth/onboarding/email/request {email}; POST …/email/verify {email, code} или GET …/email/verify-link?token=
- **Состояния:** отправка/повтор; EMAIL_TAKEN 409, INVALID_OTP 400, RATE_LIMIT 429, EMAIL_UNDELIVERED 503
- **Переходы:** → 12 «Онбординг — телефон» (onboardingChallengeId получен)

### 12 Онбординг — телефон

- **Макет Stitch:** screen `51a4986780724e678dca03361fa62916` · `screens/12.png` · `html/12.html`
- **Назначение:** Шаг 2/5: телефон + SMS-код, имя.
- **API:** POST /v2/auth/onboarding/phone/request-otp {onboardingChallengeId, phone}; POST …/phone/verify {…, code, displayName} → deviceRegistrationRequired, deviceRegistrationToken
- **Состояния:** INVALID_OTP, RATE_LIMIT, SMS_UNDELIVERED, ONBOARDING_STEP_ORDER
- **Переходы:** → 13 «Онбординг — устройство» (verified)

### 13 Онбординг — устройство

- **Макет Stitch:** screen `bd3d6ecdbaa74156add094f510224d31` · `screens/13.png` · `html/13.html`
- **Назначение:** Шаг 3/5: регистрация устройства (Web Push) с deviceRegistrationToken и подтверждение push-ссылкой или SMS.
- **API:** POST /v1/devices/register (Bearer deviceRegistrationToken, X-Trace-Id) {platform, token, device_id}; POST /v2/auth/onboarding/device/verify/request-push | request-sms | verify-sms; POST /v2/auth/onboarding/device/confirm (X-Device-Session) → userRefresh
- **Состояния:** запрос разрешения уведомлений браузера; ожидание push; SMS-fallback; DEVICE_REGISTRATION_REQUIRED, DEVICE_VERIFY_UNDELIVERED, 401 токен истёк (15 мин) → повторить шаг 2. ВНИМАНИЕ: backend принимает platform ios|android (web — нужна доработка или SMS-путь)
- **Переходы:** → 14 «Онбординг — пароль» (deviceSession + confirm)

### 14 Онбординг — пароль

- **Макет Stitch:** screen `c728e593eec642789f6866cb2aa68075` · `screens/14.png` · `html/14.html`
- **Назначение:** Шаг 4/5: личный пароль семьи.
- **API:** POST /v2/auth/onboarding/password/setup (X-User-Refresh) {onboardingChallengeId, newPassword, deviceId} → session, requiresWorkspaceFinalize
- **Состояния:** индикатор силы; WEAK_PASSWORD 400
- **Переходы:** → 15 «Онбординг — адрес семьи» (session)

### 15 Онбординг — адрес семьи

- **Макет Stitch:** screen `4fcc5c51db0c40a5808608543b7d735e` · `screens/15.png` · `html/15.html`
- **Назначение:** Шаг 5/5: slug 3–32 → workspace-логин slug@workspaces.carelink.app; проверка занятости.
- **API:** POST /v2/auth/onboarding/workspace/finalize (Bearer + X-Device-Id + X-Device-Session) {onboardingChallengeId, workspaceSlug, displayName}
- **Состояния:** превью логина; WORKSPACE_SLUG_TAKEN 409 (ошибка + предложения), PASSWORD_SETUP_REQUIRED 403
- **Переходы:** → 16 «Онбординг — семья создана» (успех)

### 16 Онбординг — семья создана

- **Макет Stitch:** screen `ad906effe21949a9a84e3e3a0395bdf6` · `screens/16.png` · `html/16.html`
- **Назначение:** Итог: показ workspace-логина, копирование, следующий шаг — пригласить близких.
- **API:** — (данные из ответа finalize)
- **Состояния:** success
- **Переходы:** → 17 «Пригласить участника — форма» (Пригласить участника); → 33 «Главная — мои семьи» (На главную)

## E. Приглашение участника по email + телефону (scn-invite-new, scn-invite-existing)

### 17 Пригласить участника — форма

- **Макет Stitch:** screen `4a2ce9a83b844032a6392dfb92f48250` · `screens/17.png` · `html/17.html`
- **Назначение:** Хранитель вводит имя, личную почту, телефон, роль, фото. Живая проверка: email уже принадлежит пользователю Carelink или нет.
- **API:** GET /v1/families/{familyId}/role-templates; POST /v1/families/{familyId}/member-invites/lookup-email {email} → {registered}; POST /v1/families/{familyId}/member-invites/avatar (multipart); POST /v1/families/{familyId}/member-invites {roleTemplateId, displayName, phone, personalEmail, avatarUrl}
- **Состояния:** lookup: проверка…/«Новый пользователь — получит логин и временный пароль»/«Уже в Carelink — пароль не изменится, нужно принять приглашение»; ошибки FORBIDDEN 403 (не хранитель), NOT_FOUND 404, NOT_IMPLEMENTED 501, RATE_LIMIT 429 (lookup), EMAIL_UNDELIVERED 503, AVATAR_TOO_LARGE 413
- **Переходы:** → 18 «Приглашение отправлено — новый пользователь» (isNewUser (emailSent)); → 19 «Приглашение отправлено — уже в Carelink» (существующий (pending_accept)); → 28 «Нет прав хранителя» (403/404 не хранитель)

### 18 Приглашение отправлено — новый пользователь

- **Макет Stitch:** screen `cb1ea3f5026b4bf48b2d0cad1a2004c4` · `screens/18.png` · `html/18.html`
- **Назначение:** Подтверждение: на личную почту ушли workspace-логин, одноразовый пароль (72 ч) и код приглашения; участник сразу в семье.
- **API:** результат POST …/member-invites (201 {inviteId, emailSent:true})
- **Состояния:** success
- **Переходы:** → 20 «Приглашения семьи — список» (К приглашениям); → 17 «Пригласить участника — форма» (Пригласить ещё)

### 19 Приглашение отправлено — уже в Carelink

- **Макет Stitch:** screen `9e31acd9980c4b7fb3d856948e5fcbc2` · `screens/19.png` · `html/19.html`
- **Назначение:** Подтверждение: пароль человека не меняется, приглашение ждёт принятия 7 дней.
- **API:** результат POST …/member-invites (статус pending_accept)
- **Состояния:** success/info
- **Переходы:** → 20 «Приглашения семьи — список» (К приглашениям)

### 20 Приглашения семьи — список

- **Макет Stitch:** screen `7b7b13c8715246739dd1e2802bb0c5c6` · `screens/20.png` · `html/20.html`
- **Назначение:** Список приглашений хранителя со статусами; пустое состояние.
- **API:** GET /v1/families/{familyId}/member-invites
- **Состояния:** loading skeleton; empty («Пока никого не пригласили»); статусы Отправлено/Ожидает принятия/Принято/Отклонено/Истекло
- **Переходы:** → 17 «Пригласить участника — форма» (Пригласить)

### 21 Входящие приглашения

- **Макет Stitch:** screen `dfb1fee7105a4996b4645ec5291599d6` · `screens/21.png` · `html/21.html`
- **Назначение:** Существующий пользователь после обычного входа видит приглашения в другие семьи и принимает/отклоняет.
- **API:** GET /v1/user/member-invites/pending; POST /v1/user/member-invites/{inviteId}/accept | decline
- **Состояния:** loading; empty; accept success (семья появляется в переключателе); ошибки → 22
- **Переходы:** → 33 «Главная — мои семьи» (принято); → 22 «Приглашение недоступно» (403/400/404)

### 22 Приглашение недоступно

- **Макет Stitch:** screen `055503423b0a4089bac0301786a03677` · `screens/22.png` · `html/22.html`
- **Назначение:** Ошибка: приглашение уже использовано, истекло или адресовано другому.
- **API:** accept → 403 «not invitee», 400 «invite expired»/не pending_accept, 404
- **Состояния:** error-state с причиной
- **Переходы:** → 21 «Входящие приглашения» (к приглашениям); → 33 «Главная — мои семьи» (на главную)

### 23 Приглашение по ссылке

- **Макет Stitch:** screen `b879c0b0915647f8aea30566704ebb5a` · `screens/23.png` · `html/23.html`
- **Назначение:** Публичная страница /invite?code= из письма: семья приглашает вас; для нового — войти с логином и временным паролем; для существующего — войти и принять.
- **API:** ссылка {INVITE_LINK_BASE_URL}/invite?code=… (universal link); далее вход 01 → 05 или 21
- **Состояния:** default; ссылка недействительна → 22
- **Переходы:** → 01 «Вход — Workspace» (Войти); → 22 «Приглашение недоступно» (код недействителен)

## F. Заявка на вступление по коду / pairing (scn-pairing)

### 24 Вступление по коду

- **Макет Stitch:** screen `cae4841d08134c348f9b08266e14f865` · `screens/24.png` · `html/24.html`
- **Назначение:** Ввод кода/ссылки pairing-сессии; показ семьи и роли.
- **API:** POST /v1/auth/pair/resolve {sessionId} → familyName, memberCount, slotLabel, roleLabel
- **Состояния:** loading; PAIR_SESSION_NOT_FOUND 404, PAIR_SESSION_EXPIRED 400, RATE_LIMIT 429
- **Переходы:** → 25 «Вступление — телефон и имя» (семья найдена)

### 25 Вступление — телефон и имя

- **Макет Stitch:** screen `751e8272105e482d85e2efb8a7cc44d2` · `screens/25.png` · `html/25.html`
- **Назначение:** Новичок подтверждает телефон 4-значным кодом и вводит имя и код приглашения.
- **API:** POST /v2/auth/pair/phone/request-otp {phone}; POST …/pair/phone/verify {phone, code} → registrationToken; POST /v1/auth/pair/confirm {sessionId, code, name, registrationToken, unionRole} → {requestId, approvalSecret}
- **Состояния:** PHONE_REGISTERED 409 (→ войти через 01), INVALID_OTP 400, INVALID_PAIR_CODE 400, RATE_LIMIT 429 (5 неверных кодов)
- **Переходы:** → 26 «Вступление — ожидание хранителя» (pending); → 01 «Вход — Workspace» (телефон уже зарегистрирован)

### 26 Вступление — ожидание хранителя

- **Макет Stitch:** screen `57e4fdf42b5d400ba5100bb1e6ecc799` · `screens/26.png` · `html/26.html`
- **Назначение:** Ожидание решения хранителя; опрос статуса или GraphQL-подписка; итог одобрено/отклонено.
- **API:** POST /v1/auth/pair/approval-status {requestId, approvalSecret} (polling) или subscription joinRequestApproved
- **Состояния:** pending (loading); approved → session (участнику выдаётся временный пароль, см. 05); rejected
- **Переходы:** → 33 «Главная — мои семьи» (approved); → 01 «Вход — Workspace» (rejected → на вход)

### 27 Хранитель: заявки на вступление

- **Макет Stitch:** screen `80178c6648594a81a654d30afdcf3569` · `screens/27.png` · `html/27.html`
- **Назначение:** Список заявок с одобрением/отказом; пустое состояние.
- **API:** POST /v1/auth/pair/approve {requestId}; POST /v1/auth/pair/reject {requestId} (Bearer хранителя); push хранителю через outbox
- **Состояния:** loading; empty; approve/reject success-toast; 401 UNAUTHORIZED (не хранитель) → 28; 500 «join request is not pending»
- **Переходы:** → 28 «Нет прав хранителя» (не хранитель)

### 28 Нет прав хранителя

- **Макет Stitch:** screen `41733718fa0d43ca8b6a4d99e8d02f9a` · `screens/28.png` · `html/28.html`
- **Назначение:** Ошибка доступа: действие доступно только реальному хранителю этой семьи (KEEPER_NOT_FOUND / UNAUTHORIZED / FORBIDDEN).
- **API:** approve/reject 401; member-invites 403 «keeper required»; recovery 404; delegate 403
- **Состояния:** error-state
- **Переходы:** → 33 «Главная — мои семьи» (на главную)

## G. Восстановление доступа через семью и блокировка (scn-recovery)

### 29 Восстановление — запрос

- **Макет Stitch:** screen `8afa41f1ffb2407180d4658efc99ca67` · `screens/29.png` · `html/29.html`
- **Назначение:** Забыли пароль: адрес семьи + телефон. Ответ всегда одинаковый.
- **API:** POST /v2/auth/recovery/request {familySlug, phone} → 202
- **Состояния:** отправлено (нейтральный текст); RATE_LIMIT 429 (раз в 10 мин, 3/ч); NOT_IMPLEMENTED 501
- **Переходы:** → 30 «Восстановление — новый пароль» (отправлено)

### 30 Восстановление — новый пароль

- **Макет Stitch:** screen `2a32b98c0ec04d589531378ff18abbc0` · `screens/30.png` · `html/30.html`
- **Назначение:** После одобрения хранителем: SMS-код + новый пароль.
- **API:** POST /v2/auth/recovery/confirm {requestId, code, newPassword, phone, deviceId} → session
- **Состояния:** ожидание одобрения; INVALID_OTP 400, RECOVERY_GONE 410 (код использован/истёк/попытки), WEAK_PASSWORD 400
- **Переходы:** → 33 «Главная — мои семьи» (успех, все старые сессии отозваны); → 29 «Восстановление — запрос» (RECOVERY_GONE → новый запрос)

### 31 Хранитель: запрос на восстановление

- **Макет Stitch:** screen `97a520cf41364c3da928b5aad99d976b` · `screens/31.png` · `html/31.html`
- **Назначение:** Хранитель видит запрос участника и одобряет одноразовое восстановление, отклоняет или блокирует аккаунт.
- **API:** GET /v1/recovery-requests/{id}?familyId=; POST …/approve {phone} | /reject | /lock
- **Состояния:** loading; success; NOT_FOUND 404 (не хранитель/чужая семья) → 28
- **Переходы:** → 34 «Семья — участники» (готово); → 28 «Нет прав хранителя» (404)

### 32 Аккаунт заблокирован

- **Макет Stitch:** screen `c408cd042ce9427e95adb2e52ad97000` · `screens/32.png` · `html/32.html`
- **Назначение:** Аккаунт заблокирован хранителем; вход и refresh невозможны до разблокировки.
- **API:** refresh → 401 (recovery lock); разблокировка хранителем POST /v1/families/{familyId}/members/{userId}/unlock
- **Состояния:** error-state
- **Переходы:** → 01 «Вход — Workspace» (на вход)

## H. Семьи: главная, участники, создание, аудит (scn-families, scn-push)

### 33 Главная — мои семьи

- **Макет Stitch:** screen `094692669fda4f11918f7d59b6dad8cc` · `screens/33.png` · `html/33.html`
- **Назначение:** Дашборд после входа: семьи пользователя, роль, участники, индикаторы, входящие приглашения.
- **API:** GET /v1/user/families?page&limit; ?sync=RFC3339 (дельта); GraphQL me; GET /v1/user/member-invites/pending (бейдж)
- **Состояния:** loading skeleton; empty (нет семей → создать/принять приглашение); error
- **Переходы:** → 34 «Семья — участники» (открыть семью); → 35 «Создать семью» (создать семью); → 21 «Входящие приглашения» (приглашения)

### 34 Семья — участники

- **Макет Stitch:** screen `56973090a14e412fb5f4ced3b8f84726` · `screens/34.png` · `html/34.html`
- **Назначение:** Участники и роли (бейдж «Хранитель»), приглашения, заблокированные участники с разблокировкой.
- **API:** GET /v1/families/{familyId}/member-invites; GET /v1/families/{familyId}/role-templates; POST /v1/families/{familyId}/members/{userId}/unlock
- **Состояния:** loading; empty; locked member
- **Переходы:** → 17 «Пригласить участника — форма» (пригласить); → 36 «Журнал безопасности семьи» (журнал безопасности); → 27 «Хранитель: заявки на вступление» (заявки)

### 35 Создать семью

- **Макет Stitch:** screen `f35c2223e2dc4c25bdfba667b4c5b408` · `screens/35.png` · `html/35.html`
- **Назначение:** Создание ещё одной семьи (имя, адрес).
- **API:** POST /v1/families {name, unionRole} (Idempotency-Key, X-Device-Id, X-Device-Session) → 201 {id, name, memberCount, session}
- **Состояния:** WORKSPACE_SLUG_TAKEN 409, DEVICE_SESSION_REQUIRED 403
- **Переходы:** → 34 «Семья — участники» (создана)

### 36 Журнал безопасности семьи

- **Макет Stitch:** screen `5e96fb80845a4ee6840ee8f7ffed3cb8` · `screens/36.png` · `html/36.html`
- **Назначение:** Аудит: приглашения, восстановления, блокировки, вход через хранителя.
- **API:** GET /v1/families/{familyId}/security-audit
- **Состояния:** loading; empty; фильтры
- **Переходы:** → 34 «Семья — участники» (назад)

## I. Профиль, аватар, устройства, сессии, уведомления (scn-me, scn-avatar, scn-device, scn-refresh, scn-push)

### 37 Профиль и аватар

- **Макет Stitch:** screen `060de5d66ec14bbeb35f220e8949695b` · `screens/37.png` · `html/37.html`
- **Назначение:** Имя, workspace-логин, загрузка аватара.
- **API:** GraphQL query me; PATCH /v1/user/me {displayName}; POST /v1/user/me/avatar (multipart file)
- **Состояния:** загрузка (progress); AVATAR_TOO_LARGE 413; BAD_REQUEST 400 (тип); STORAGE_UNAVAILABLE 503; сохранено
- **Переходы:** → 38 «Устройства и сессии» (устройства)

### 38 Устройства и сессии

- **Макет Stitch:** screen `6a2582dd9ffb4c71981c6b4a9ea79fcc` · `screens/38.png` · `html/38.html`
- **Назначение:** Список устройств (доверенное/активное), отзыв устройства, выход везде.
- **API:** GET /v2/auth/devices; DELETE /v2/auth/devices/{clientDeviceId}; POST /v1/auth/logout {refresh, allDevices}
- **Состояния:** loading; empty; подтверждение отзыва; DEVICE_SESSION_REQUIRED 403
- **Переходы:** → 40 «Сессия завершена» (выйти везде)

### 39 Уведомления

- **Макет Stitch:** screen `81878c2454714656a269d3380ee9c14a` · `screens/39.png` · `html/39.html`
- **Назначение:** Центр уведомлений: заявки на вступление, восстановление, вход через хранителя, приглашения; настройки Web Push.
- **API:** push через notification (outbox family); POST /v1/devices/register (access JWT) для Web Push
- **Состояния:** loading; empty («Всё спокойно»); unread
- **Переходы:** → 27 «Хранитель: заявки на вступление» (заявка); → 31 «Хранитель: запрос на восстановление» (восстановление); → 10 «Хранитель: подтвердить вход участника» (вход участника); → 21 «Входящие приглашения» (приглашение)

### 40 Сессия завершена

- **Макет Stitch:** screen `9ddddd39f7f14bcd837f3a2830c6c0cd` · `screens/40.png` · `html/40.html`
- **Назначение:** Сессия истекла или отозвана (refresh reuse, выход на всех устройствах).
- **API:** POST /v1/auth/token/refresh (X-Scope family:<id>) → 401 UNAUTHORIZED/TOKEN_EXPIRED
- **Состояния:** info
- **Переходы:** → 01 «Вход — Workspace» (войти снова)
