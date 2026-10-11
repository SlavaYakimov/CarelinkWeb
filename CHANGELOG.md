# Changelog

Carelink Web follows [Semantic Versioning](https://semver.org/) aligned with CarelinkAuth and Carelink (`VERSION` + git tag `vX.Y.Z`).

## [0.1.0] - 2026-10-11

Первый согласованный релиз линии **0.1.0** (BFF, онбординг, recovery, compose E2E). SHA на `main` для тега — см. PR / `git rev-parse origin/main`.

### feat

- **W-01–W-03:** scaffold Next.js BFF, design system, server core (session, gateway, security).
- **W-04–W-08:** workspace login, SMS verify, change password, logout, delegate sign-in.
- **auth / onboarding:** family recovery, onboarding screens 11–16, phone verify, slug check, device session flows, registered-phone prefill.
- **app:** shell «Мои семьи», session-ended handling, CSP/dev fixes.
- **e2e:** Playwright pages + Cypress flows; compose onboarding/recovery with OTP helpers.
- **gateway:** onboarding abandon, slug types sync.

### fix

- Audit issues #28–#35 (CI, E2E, a11y, redis).
- Forms: nested OTP/resend, recovery API disabled hint, workspace slug fields.
- Env: nested quotes in enum values; empty `deviceSession` taint skip.

### chore / docs / refactor

- CarelinkMemory submodule + shared Cursor rules sync.
- Next 16, Cypress 16, Vitest 4; Dependabot policy; epic commit conventions in Cursor rules.
- Contracts OpenAPI → generated gateway types.

[0.1.0]: https://github.com/SlavaYakimov/CarelinkWeb/releases/tag/v0.1.0
