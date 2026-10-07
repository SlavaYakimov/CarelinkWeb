Cypress.Commands.add('fillWorkspaceEmail', (emailOrSlug: string) => {
  const at = emailOrSlug.indexOf('@');
  const slug = at > 0 ? emailOrSlug.slice(0, at) : emailOrSlug;
  cy.get('#workspaceSlug').clear().type(slug);
});

Cypress.Commands.add('submitLoginExpectPasswordMinLength', () => {
  cy.contains('button', 'Войти').click();
  cy.contains('[role="alert"]', 'Не короче 8 символов').should('be.visible');
  cy.location('pathname').should('eq', '/login');
});

Cypress.Commands.add('openLoginRecoveryFromForgotLink', () => {
  cy.contains('a', 'Забыли пароль? Восстановить через семью').click();
  cy.location('pathname').should('eq', '/login/recovery');
  cy.contains('h3', 'Восстановление через семью').should('be.visible');
  cy.get('#familySlug').should('be.visible');
  cy.get('#phone').should('be.visible');
});

Cypress.Commands.add('submitRecoveryRequest', (familySlug: string, phoneDigits: string) => {
  cy.get('#familySlug').clear().type(familySlug);
  cy.get('#phone').clear().type(phoneDigits);
  cy.contains('button', 'Отправить запрос хранителю').click();
});

Cypress.Commands.add('assertRecoverySentPage', () => {
  cy.location('pathname', { timeout: 30_000 }).should('eq', '/login/recovery/sent');
  cy.contains('Запрос отправлен').should('be.visible');
});

Cypress.Commands.add('openRecoveryConfirmFromSent', () => {
  cy.contains('a', 'У меня уже есть код').click();
  cy.location('pathname').should('eq', '/login/recovery/confirm');
  cy.contains('h3', 'Новый пароль').should('be.visible');
});

Cypress.Commands.add(
  'submitRecoveryConfirm',
  (requestId: string, otpCode: string, newPassword: string) => {
    cy.get('#requestId').clear().type(requestId);
    cy.fillOtp(otpCode);
    cy.get('#newPassword').clear().type(newPassword, { log: false });
    cy.get('#confirmPassword').clear().type(newPassword, { log: false });
    cy.contains('button', 'Сохранить и войти').click();
  },
);
