/**
 * Negative / boundary cases for keeper onboarding (create family).
 * Run: CYPRESS_E2E_COMPOSE=1 pnpm cypress run --spec cypress/e2e/_compose/onboarding-create-family.negative.cy.ts
 */

function runSuffix(): string {
  const env = (Cypress.config().env ?? {}) as { RUN_ID?: string; CYPRESS_RUN_ID?: string };
  const runId = env.RUN_ID ?? env.CYPRESS_RUN_ID;
  return runId ? String(runId) : Date.now().toString();
}

function uniqueEmail(): string {
  return `e2e-neg+${runSuffix()}@example.com`;
}

function uniqueSlug(): string {
  const raw = runSuffix().replace(/\W/g, '');
  return `neg${raw.slice(-10).padStart(6, '0')}`;
}

function uniquePhoneDigits(): string {
  return `900${String(Date.now()).slice(-7)}`;
}

/** Email sent → OTP phase on /onboarding/email */
function advanceToEmailOtpPhase(email: string): void {
  cy.visit('/onboarding/email');
  cy.get('#email').clear().type(email);
  cy.contains('button', 'Отправить код').click();
  cy.contains('Код отправлен на', { timeout: 30_000 }).should('be.visible');
}

/** Through email OTP to /onboarding/phone */
function advanceToPhoneStep(email: string): void {
  advanceToEmailOtpPhase(email);
  cy.task<string>('fetchOnboardingOtp', { channel: 'email', to: email }).then((otp) => {
    cy.onboardingEnterEmailOtp(otp);
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/phone');
  });
}

/** Through phone SMS request (OTP phase on phone) */
function advanceToPhoneOtpPhase(email: string, displayName: string, phoneDigits: string): void {
  advanceToPhoneStep(email);
  cy.get('#displayName').clear().type(displayName);
  cy.get('#phone').clear().type(phoneDigits);
  cy.contains('button', 'Отправить SMS-код').click();
  cy.contains('Код из SMS', { timeout: 30_000 }).should('be.visible');
}

/** Through device step to /onboarding/password */
function advanceToPasswordStep(email: string, displayName: string, phoneDigits: string): void {
  advanceToPhoneOtpPhase(email, displayName, phoneDigits);
  cy.task<string>('fetchOnboardingOtp', { channel: 'sms', to: phoneDigits }).then((phoneOtp) => {
    cy.fillOtp(phoneOtp);
    cy.contains('button', 'Подтвердить').click();
    cy.onboardingEnterDeviceSms(phoneDigits);
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/password');
  });
}

describe('onboarding create family — negative (guest routing)', () => {
  const protectedPaths = ['/onboarding/phone', '/onboarding/device', '/onboarding/workspace'];

  protectedPaths.forEach((path) => {
    it(`redirects ${path} to /onboarding/email without flow cookie`, () => {
      cy.visit(path);
      cy.location('pathname', { timeout: 15_000 }).should('eq', '/onboarding/email');
      cy.contains('h1', 'Личная почта').should('be.visible');
    });
  });

  it('redirects /onboarding/password without flow to email', () => {
    cy.visit('/onboarding/password');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/onboarding/email');
  });

  it('redirects /onboarding/done without flow to email', () => {
    cy.visit('/onboarding/done');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/onboarding/email');
  });
});

describe('onboarding create family — negative (compose BE-21)', () => {
  const displayName = 'E2E Негатив';
  const password = 'Testpass1';

  beforeEach(() => {
    cy.task('flushE2eRedis');
    cy.clearAllCookies();
  });

  it('rejects invalid email before gateway call', () => {
    cy.visit('/onboarding/email');
    cy.get('#email').clear().type('not-an-email');
    cy.contains('button', 'Отправить код').click();
    cy.location('pathname').should('eq', '/onboarding/email');
    cy.contains('Укажите корректную почту').should('be.visible');
  });

  it('keeps email OTP submit disabled until 6 digits', () => {
    const email = uniqueEmail();
    advanceToEmailOtpPhase(email);
    for (let i = 0; i < 5; i += 1) {
      cy.get(`[aria-label="Цифра ${i + 1} из 6"]`).type('1');
    }
    cy.contains('button', 'Продолжить').should('be.disabled');
  });

  it('keeps phone OTP submit disabled until 6 digits', () => {
    const email = uniqueEmail();
    advanceToPhoneOtpPhase(email, displayName, uniquePhoneDigits());
    for (let i = 0; i < 5; i += 1) {
      cy.get(`[aria-label="Цифра ${i + 1} из 6"]`).type('1');
    }
    cy.contains('button', 'Подтвердить').should('be.disabled');
  });

  it('keeps phone submit disabled without valid E.164', () => {
    const email = uniqueEmail();
    advanceToPhoneStep(email);
    cy.get('#displayName').clear().type(displayName);
    cy.get('#phone').clear().type('900');
    cy.contains('button', 'Отправить SMS-код').should('be.disabled');
  });

  it('shows INVALID_OTP alert on wrong phone SMS code', () => {
    const email = uniqueEmail();
    advanceToPhoneOtpPhase(email, displayName, uniquePhoneDigits());
    cy.fillOtp('000000');
    cy.contains('button', 'Подтвердить').click();
    cy.location('pathname').should('eq', '/onboarding/phone');
    cy.contains('Неверный код').should('be.visible');
  });

  it('clears flow cookie and resets guarded step to email', () => {
    const email = uniqueEmail();
    advanceToPhoneStep(email);
    cy.clearCarelinkCookie('cl_flow');
    cy.visit('/onboarding/phone');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/onboarding/email');
  });

  it('resets onboarding when requesting a new email after phone step', () => {
    const email = uniqueEmail();
    const email2 = uniqueEmail();
    advanceToPhoneStep(email);
    cy.visit('/onboarding/email');
    cy.get('#email').clear().type(email2);
    cy.contains('button', 'Отправить код').click();
    cy.contains('Код отправлен на', { timeout: 30_000 }).should('be.visible');
    cy.clearCarelinkCookie('cl_flow');
    cy.visit('/onboarding/phone');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/onboarding/email');
  });

  it('redirects /onboarding/done to email when flow step is not done', () => {
    const email = uniqueEmail();
    advanceToPasswordStep(email, displayName, uniquePhoneDigits());
    cy.visit('/onboarding/done');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/onboarding/email');
  });

  it('redirects workspace finalize to password when session cookie is cleared', () => {
    const email = uniqueEmail();
    const slug = uniqueSlug();
    advanceToPasswordStep(email, displayName, uniquePhoneDigits());
    cy.onboardingEnterPassword(password);
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/workspace');
    cy.get('#workspaceSlug').clear().type(slug);
    cy.get('#workspaceSlug').blur();
    cy.contains('Проверяем, свободен ли адрес', { timeout: 15_000 }).should('not.exist');
    cy.contains('button', 'Создать семью', { timeout: 15_000 }).should('not.be.disabled');
    cy.clearCarelinkCookie('cl_sid');
    cy.contains('button', 'Создать семью').click();
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/password');
  });

  it('rejects weak password and mismatched confirm on password step', () => {
    const email = uniqueEmail();
    advanceToPasswordStep(email, displayName, uniquePhoneDigits());
    cy.get('#newPassword').clear().type('longenough');
    cy.get('#confirmPassword').clear().type('longenough');
    cy.contains('button', 'Сохранить пароль').click();
    cy.contains('[role=alert]', 'Пароль не соответствует требованиям').should('be.visible');
    cy.get('#newPassword').clear().type(password);
    cy.get('#confirmPassword').clear().type('Otherpass1');
    cy.contains('button', 'Сохранить пароль').click();
    cy.contains('Пароли не совпадают').should('be.visible');
  });

  it('shows slug validation error for invalid workspace slug', () => {
    const email = uniqueEmail();
    advanceToPasswordStep(email, displayName, uniquePhoneDigits());
    cy.onboardingEnterPassword(password);
    cy.get('#workspaceSlug').clear().type('ab');
    cy.get('#workspaceSlug').blur();
    cy.contains('Только латиница, цифры и дефис', { timeout: 10_000 }).should('be.visible');
    cy.contains('button', 'Создать семью').should('be.disabled');
  });

  it('keeps workspace submit disabled until slug debounce check completes', () => {
    const email = uniqueEmail();
    const slug = uniqueSlug();
    advanceToPasswordStep(email, displayName, uniquePhoneDigits());
    cy.onboardingEnterPassword(password);
    cy.get('#workspaceSlug').clear().type(slug);
    cy.contains('button', 'Создать семью').should('be.disabled');
    cy.contains('Проверяем, свободен ли адрес', { timeout: 15_000 }).should('not.exist');
    cy.contains('button', 'Создать семью', { timeout: 15_000 }).should('not.be.disabled');
  });

  it('sends at most two email action POSTs on double click of «Отправить код»', () => {
    const email = uniqueEmail();
    cy.intercept('POST', '**/onboarding/email').as('emailPost');
    cy.visit('/onboarding/email');
    cy.get('#email').clear().type(email);
    cy.contains('button', 'Отправить код').dblclick();
    cy.contains('Код отправлен на', { timeout: 30_000 }).should('be.visible');
    cy.get('@emailPost.all', { timeout: 5_000 }).then((interceptions) => {
      expect(interceptions.length).to.be.at.most(2);
    });
  });

  it('completes onboarding through workspace to done', () => {
    const email = uniqueEmail();
    const slug = uniqueSlug();
    advanceToPasswordStep(email, displayName, uniquePhoneDigits());
    cy.onboardingEnterPassword(password);
    cy.onboardingFinalizeWorkspace(slug, displayName);
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/done');
    cy.contains('h1', 'Семья создана').should('be.visible');
  });

  it('keeps /onboarding/done after reload while flow remains', () => {
    const email = uniqueEmail();
    const slug = uniqueSlug();
    advanceToPasswordStep(email, displayName, uniquePhoneDigits());
    cy.onboardingEnterPassword(password);
    cy.onboardingFinalizeWorkspace(slug, displayName);
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/done');
    cy.reload();
    cy.contains('h1', 'Семья создана', { timeout: 15_000 }).should('be.visible');
  });
});
