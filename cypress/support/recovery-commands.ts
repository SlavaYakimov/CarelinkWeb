Cypress.Commands.add('fillWorkspaceEmail', (emailOrSlug: string) => {
  const at = emailOrSlug.indexOf('@');
  const slug = at > 0 ? emailOrSlug.slice(0, at) : emailOrSlug;
  cy.get('#workspaceSlug').clear().type(slug);
});

Cypress.Commands.add('submitLoginExpectPasswordMinLength', () => {
  cy.get('#password').clear().type('short7', { log: false });
  cy.assertGatedValidation({
    submitLabel: 'Войти',
    blurSelector: '#password',
    errorText: 'Не короче 8 символов',
  });
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
  cy.get('#phone').then(($el) => {
    $el[0].focus();
    $el[0].blur();
  });
  cy.clickSubmitWhenEnabled('Отправить запрос хранителю');
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
    cy.get('#newPassword').clear().type(newPassword, { log: false });
    cy.get('#confirmPassword').clear().type(newPassword, { log: false });
    cy.get('#requestId').then(($el) => {
      $el[0].focus();
      $el[0].blur();
    });
    cy.get('#newPassword').then(($el) => {
      $el[0].focus();
      $el[0].blur();
    });
    cy.get('#confirmPassword').then(($el) => {
      $el[0].focus();
      $el[0].blur();
    });
    cy.fillOtp(otpCode, 'recovery-otp');
    cy.get('input[name="code"]').should('have.value', otpCode.replace(/\D/g, '').slice(0, 6));
    cy.clickSubmitWhenEnabled('Сохранить и войти');
  },
);

Cypress.Commands.add(
  'completeRecoveryToFamilies',
  (
    fixture: {
      workspaceEmail: string;
      workspaceSlug: string;
      phoneDigits: string;
      password: string;
    },
    newPassword: string,
    keeper?: { keeperWorkspaceEmail: string; keeperPassword: string },
  ) => {
    const familySlug = fixture.workspaceSlug;
    cy.clearCarelinkCookie('cl_sid');
    cy.visitLogin();
    cy.openLoginRecoveryFromForgotLink();
    cy.submitRecoveryRequest(familySlug, fixture.phoneDigits);
    cy.assertRecoverySentPage();
    cy.openRecoveryConfirmFromSent();
    cy.task<{ requestId: string; smsCode: string }>('approveRecoveryRequest', {
      phoneDigits: fixture.phoneDigits,
      keeperWorkspaceEmail: keeper?.keeperWorkspaceEmail,
      keeperPassword: keeper?.keeperPassword,
    }).then(({ requestId, smsCode }) => {
      cy.submitRecoveryConfirm(requestId, smsCode, newPassword);
      cy.location('pathname', { timeout: 30_000 }).should('eq', '/families');
    });
  },
);
