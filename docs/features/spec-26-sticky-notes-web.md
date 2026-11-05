# SPEC-26 — веб: любовная записка и метки участников

> Дельта контракта vendored в `contracts/family.openapi.yaml` (источник истины до sync с CarelinkAuth PR #368, ветка `cursor/sticky-notes-spec-26-efa7`). После мержа BE — сверить поля envelope и `maxPlaintextChars` с `docs/backend/family/openapi.yaml`.

## Маршруты

| Маршрут                             | Назначение                                                  |
| ----------------------------------- | ----------------------------------------------------------- |
| `/families/[familyId]`              | Хаб семьи: ссылки на записки и участников                   |
| `/families/[familyId]/sticky-notes` | Отправка текста + виджет последней полученной записки       |
| `/families/[familyId]/members`      | Список участников, метки (бейджи), назначение метки пакетом |

## Компоненты

| Компонент              | Слой          | Описание                                                                    |
| ---------------------- | ------------- | --------------------------------------------------------------------------- |
| `StickyNoteSendForm`   | client        | Выбор получателя, textarea, счётчик, шифрование envelope, server action     |
| `StickyNoteWidgetCard` | client        | Расшифровка envelope, вывод текста `white-space: pre-wrap` без нормализации |
| `StickyNotePlaintext`  | client        | Безопасный вывод строки отправителя (React escape)                          |
| `FamilyMemberPicker`   | client        | Чекбоксы, «Выбрать всех», лимит 10, счётчик «Назначить (N)»                 |
| `MemberLabelBadge`     | server/client | Бейдж метки рядом с именем                                                  |
| `MemberLabelAssignBar` | client        | Поле текста ≤24, submit batch                                               |

## Сервер

| Модуль                                    | Роль                                         |
| ----------------------------------------- | -------------------------------------------- |
| `src/server/gateway/sticky-notes.ts`      | REST sticky-notes (контракт PR #368)         |
| `src/server/gateway/member-labels.ts`     | REST member-labels (черновик; mock в тестах) |
| `src/server/gateway/family-members.ts`    | `GET …/members` (BE-12, для UI)              |
| `src/server/actions/sticky-notes.ts`      | create / mark read / delete                  |
| `src/server/actions/member-labels.ts`     | create batch / delete                        |
| `src/lib/sticky-notes/envelope-crypto.ts` | AES-256-GCM + HKDF-SHA256 (Web Crypto)       |
| `src/lib/sticky-notes/family-key.ts`      | **OPEN SN-OQ-1** — заглушка семейного ключа  |

## Ошибки (UI)

| Код / HTTP                         | Поведение                                        |
| ---------------------------------- | ------------------------------------------------ |
| `RESTRICTED_SESSION` / 403         | Бanner: гостевой или ограниченный режим          |
| `FORBIDDEN` / 403                  | Недостаточно роли                                |
| `RATE_LIMIT` / 429 + `Retry-After` | Лимит 10 записок/день, показ секунд              |
| 503 / `OFFLINE`                    | Сервис недоступен                                |
| Идемпотентность                    | `clientNoteId` (UUID) на каждую попытку отправки |

## Тесты

- Unit: envelope crypto round-trip, zod-схемы, сообщения об ошибках, member-labels batch validation
- E2e: редирект гостя с `/families/*/sticky-notes`
- Member-labels gateway: mock-слой (`tests/mocks/member-labels-gateway.mock.ts`), не прод

## ❓ Открытые вопросы

1. **SN-OQ-1** — протокол выдачи семейного content-ключа (HKDF input / rotation). Сейчас `stubFamilyContentKeyProvider` → UI «ключ семьи ещё не настроен».
2. Точное `maxPlaintextChars` и имена полей envelope — сверить с CarelinkAuth после доступа к PR #368.
3. Member-labels DELETE path и коды отката batch — сверить с PR меток поверх #368.
