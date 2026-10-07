/**
 * Full keeper onboarding — create family (PLAN.md §6, screens 11–16).
 * Requires CarelinkAuth compose BE-21 (`../CarelinkAuth`: make compose-web-e2e-up), Redis, web BFF.
 *
 * Run: pnpm test:e2e:compose:onboarding
 */

const composeEnabled = Cypress.env('E2E_COMPOSE') === '1' || Cypress.env('E2E_COMPOSE') === 1;

const describeOnboarding = composeEnabled ? describe : describe.skip;

describeOnboarding('onboarding create family (requires compose BE-21)', () => {
  it('completes email → phone → device → password → workspace → done', () => {
    const ts = Date.now();
    const email = `e2e+${ts}@example.com`;
    const workspaceSlug = `e2e${ts.toString(36).slice(-8)}`;
    const displayName = 'E2E Семья';
    const password = 'Testpass1';
    const phoneDigits = '9001234567';

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

          cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/device');
          cy.contains('button', 'Получить SMS-код').click();
          cy.contains('Введите код из SMS, чтобы доверить', { timeout: 30_000 }).should(
            'be.visible',
          );

          cy.task<string>('fetchOnboardingOtp', { channel: 'sms', to: phoneDigits }).then(
            (deviceOtp) => {
              cy.fillOtp(deviceOtp);
              cy.contains('button', 'Продолжить').click();
              cy.onboardingEnterPassword(password);
              cy.onboardingFinalizeWorkspace(workspaceSlug, displayName);

              cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/done');
              cy.contains('h1', 'Семья создана').should('be.visible');
              cy.contains('@workspaces.carelink.app').should('be.visible');
            },
          );
        },
      );
    });
  });
});
