/**
 * Negative / boundary: login + family recovery (no compose).
 * Run via production server (Server Actions): pnpm test:e2e:flows or start-server-and-test + cypress.
 * Do not point Cypress at `pnpm dev` — actions fail with "Invalid Server Actions request".
 */

describe('login and forgot password — negative (guest)', () => {
  beforeEach(() => {
    cy.task('flushE2eRedis');
    cy.clearAllCookies();
  });

  it('shows login shell with h3 title and workspace fields (R-29)', () => {
    cy.visitLogin();
    cy.get('#workspaceSlug').should('be.visible');
    cy.get('#password').should('be.visible');
    cy.contains('button', 'Войти').should('be.visible');
  });

  it('rejects short password on login without leaving /login (R-9)', () => {
    cy.visitLogin();
    cy.get('#workspaceSlug').clear().type('yakimovs');
    cy.get('#password').clear().type('short7');
    cy.contains('button', 'Войти').click();
    cy.contains('[role="alert"]', 'Не короче 8 символов').should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('rejects invalid workspace slug on login (R-9)', () => {
    cy.visitLogin();
    cy.get('#workspaceSlug').clear().type('ab');
    cy.get('#password').clear().type('longenough');
    cy.contains('button', 'Войти').click();
    cy.contains('[role="alert"]', 'Адрес семьи не короче 3 символов').should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('redirects /login/recovery/sent without recovery flow (R-5)', () => {
    cy.visit('/login/recovery/sent');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/login/recovery');
    cy.contains('h3', 'Восстановление через семью').should('be.visible');
  });

  it('redirects /login/recovery/confirm without recovery flow (R-5)', () => {
    cy.visit('/login/recovery/confirm');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/login/recovery');
  });

  it('redirects confirm after recovery flow cookie is cleared (R-3, R-28)', () => {
    cy.visit('/login/recovery');
    cy.submitRecoveryRequest('yakimovs', '9001234567');
    cy.location('pathname', { timeout: 45_000 }).should('eq', '/login/recovery/sent');
    cy.clearCarelinkCookie('cl_flow');
    cy.visit('/login/recovery/confirm');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/login/recovery');
    cy.task('flushE2eRedis');
    cy.visit('/login/recovery/confirm');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/login/recovery');
  });

  it('rejects short family slug on recovery request (R-10)', () => {
    cy.visit('/login/recovery');
    cy.get('#familySlug').clear().type('ab');
    cy.get('#phone').clear().type('9001234567');
    cy.contains('button', 'Отправить запрос хранителю').click();
    cy.contains('[role="alert"]', 'Адрес семьи не короче 3 символов').should('be.visible');
    cy.location('pathname').should('eq', '/login/recovery');
  });

  it('rejects non-latin family slug on recovery (R-10)', () => {
    cy.visit('/login/recovery');
    cy.get('#familySlug').clear().type('Yakimovs');
    cy.get('#phone').clear().type('9001234567');
    cy.contains('button', 'Отправить запрос хранителю').click();
    cy.contains('[role="alert"]', 'Только латиница, цифры и дефис').should('be.visible');
    cy.location('pathname').should('eq', '/login/recovery');
  });

  it('rejects workspace email in family slug field (R-14)', () => {
    cy.visit('/login/recovery');
    cy.get('#familySlug').clear().type('yakimovs@workspaces.carelink.app');
    cy.get('#phone').clear().type('9001234567');
    cy.contains('button', 'Отправить запрос хранителю').click();
    cy.contains('[role="alert"]', 'Только латиница, цифры и дефис').should('be.visible');
    cy.location('pathname').should('eq', '/login/recovery');
  });

  it('rejects invalid phone on recovery request (R-11)', () => {
    cy.visit('/login/recovery');
    cy.get('#familySlug').clear().type('yakimovs');
    cy.get('#phone').clear().type('900');
    cy.contains('button', 'Отправить запрос хранителю').click();
    // Short display value → zod min(10) before normalizeRuPhone (`recovery.ts:29`)
    cy.contains('[role="alert"]', 'Укажите телефон').should('be.visible');
    cy.location('pathname').should('eq', '/login/recovery');
  });

  it('navigates to recovery via forgot-password link (R-30)', () => {
    cy.visitLogin();
    cy.openLoginRecoveryFromForgotLink();
  });

  it('redirects /families to login when session cookie is missing (R-7 partial)', () => {
    cy.visit('/families');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/login');
    cy.url().should('include', 'next=%2Ffamilies');
  });
});
