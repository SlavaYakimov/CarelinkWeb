/**
 * Full keeper onboarding — create family (PLAN.md §6, screens 11–16).
 * Requires CarelinkAuth compose BE-21 (`../CarelinkAuth`: make compose-web-e2e-up), Redis, web BFF.
 *
 * Run: pnpm test:e2e:compose:onboarding
 */

describe('onboarding create family (requires compose BE-21)', () => {
  // Auth limits OTP/email sends to 10/h per client IP, and in compose every request comes from the gateway IP.
  beforeEach(() => {
    cy.task('flushE2eRedis');
  });

  it('completes email → phone → device → password → workspace → done', () => {
    const ts = Date.now();
    const email = `e2e+${ts}@example.com`;
    const workspaceSlug = `e2e${ts.toString(36).slice(-8)}`;
    const displayName = 'E2E Семья';
    const password = 'Testpass1';
    const phoneDigits = `900${String(ts).slice(-7)}`;

    cy.onboardingEnterEmail(email);

    cy.task<string>('fetchOnboardingOtp', { channel: 'email', to: email }).then((emailOtp) => {
      cy.onboardingEnterEmailOtp(emailOtp);

      cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/phone');
      cy.get('#displayName').clear().type(displayName);
      cy.get('#phone').clear().type(phoneDigits);
      cy.contains('button', 'Отправить SMS-код').click();
      cy.contains('Код из SMS', { timeout: 30_000 }).should('be.visible');

      cy.task<string>('fetchOnboardingOtp', { channel: 'sms', to: phoneDigits }).then(
        (phoneOtp) => {
          cy.fillOtp(phoneOtp);
          cy.contains('button', 'Подтвердить').click();

          cy.onboardingEnterDeviceSms(phoneDigits);

          cy.onboardingEnterPassword(password);
          cy.onboardingFinalizeWorkspace(workspaceSlug, displayName);

          cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/done');
          cy.contains('h1', 'Семья создана').should('be.visible');
          cy.contains('@workspaces.carelink.app').should('be.visible');
        },
      );
    });
  });

  it('creates a second family with an already registered phone via the choice screen', () => {
    const ts = Date.now();
    const password = 'Testpass1';

    cy.composeOnboardingCreateFamily(ts).then(({ phoneDigits }) => {
      cy.clearAllCookies();

      const secondTs = ts + 1;
      const email = `e2e+${secondTs}@example.com`;
      const workspaceSlug = `e2e${secondTs.toString(36).slice(-8)}`;
      const displayName = 'E2E Вторая семья';

      cy.onboardingEnterEmail(email);
      cy.task<string>('fetchOnboardingOtp', { channel: 'email', to: email }).then((emailOtp) => {
        cy.onboardingEnterEmailOtp(emailOtp);

        cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/phone');
        cy.get('#displayName').clear().type(displayName);
        cy.get('#phone').clear().type(phoneDigits);
        cy.contains('button', 'Отправить SMS-код').click();
        cy.contains('Код из SMS', { timeout: 30_000 }).should('be.visible');

        // SMS #1–2 went to the first onboarding (phone + device); this is #3.
        cy.task<string>('fetchOnboardingOtp', {
          channel: 'sms',
          to: phoneDigits,
          minRecipientMatches: 3,
        }).then((phoneOtp) => {
          cy.fillOtp(phoneOtp);
          cy.contains('button', 'Подтвердить').click();

          cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/existing');
          cy.contains('h1', 'Этот номер уже есть в Carelink').should('be.visible');
          cy.contains('button', 'Создать новую семью').click();

          cy.onboardingEnterDeviceSms(phoneDigits, 4);
          cy.onboardingEnterPassword(password);
          cy.onboardingFinalizeWorkspace(workspaceSlug, displayName);

          cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/done');
          cy.contains('h1', 'Семья создана').should('be.visible');
          cy.contains(`${workspaceSlug}@workspaces.carelink.app`).should('be.visible');
        });
      });
    });
  });

  it('signs in to a listed family from the choice screen with a prefilled address', () => {
    const ts = Date.now();

    cy.composeOnboardingCreateFamily(ts).then(({ phoneDigits, workspaceSlug, workspaceEmail }) => {
      cy.clearAllCookies();

      const email = `e2e+${ts + 2}@example.com`;
      cy.onboardingEnterEmail(email);
      cy.task<string>('fetchOnboardingOtp', { channel: 'email', to: email }).then((emailOtp) => {
        cy.onboardingEnterEmailOtp(emailOtp);

        cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/phone');
        cy.get('#displayName').clear().type('E2E Вход');
        cy.get('#phone').clear().type(phoneDigits);
        cy.contains('button', 'Отправить SMS-код').click();
        cy.contains('Код из SMS', { timeout: 30_000 }).should('be.visible');

        cy.task<string>('fetchOnboardingOtp', {
          channel: 'sms',
          to: phoneDigits,
          minRecipientMatches: 3,
        }).then((phoneOtp) => {
          cy.fillOtp(phoneOtp);
          cy.contains('button', 'Подтвердить').click();

          cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/existing');
          cy.contains('li', workspaceEmail).within(() => {
            cy.contains('button', 'Войти').click();
          });

          cy.location('pathname', { timeout: 30_000 }).should('eq', '/login');
          cy.location('search')
            .should('contain', 'reason=phone-registered')
            .and('contain', `workspace=${workspaceSlug}`);
          cy.contains('Этот номер уже есть в Carelink').should('be.visible');
          cy.get('#workspaceSlug').should('have.value', workspaceSlug);

          cy.visit('/onboarding/existing');
          cy.location('pathname', { timeout: 15_000 }).should('eq', '/onboarding/email');
        });
      });
    });
  });
});
