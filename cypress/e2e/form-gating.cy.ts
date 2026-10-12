describe('Form gating (client schema)', () => {
  it('disables login until slug and password valid', () => {
    cy.visit('/login');
    cy.contains('button', 'Войти').should('be.disabled');
    cy.get('#workspaceSlug').type('ab');
    cy.get('#password').type('short');
    cy.contains('button', 'Войти').should('be.disabled');
    cy.get('#workspaceSlug').clear().type('valid-family');
    cy.get('#password').clear().type('validpass1');
    cy.contains('button', 'Войти').should('not.be.disabled');
  });

  it('disables onboarding email send until valid email', () => {
    cy.visit('/onboarding/email');
    cy.contains('button', 'Отправить код').should('be.disabled');
    cy.get('#email').type('not-an-email');
    cy.contains('button', 'Отправить код').should('be.disabled');
    cy.get('#email').clear().type('user@example.com');
    cy.contains('button', 'Отправить код').should('not.be.disabled');
  });

  it('disables recovery request until slug and phone valid', () => {
    cy.visit('/login/recovery');
    cy.contains('button', 'Отправить запрос хранителю').should('be.disabled');
    cy.get('#familySlug').type('ab');
    cy.get('#phone').type('9001234567');
    cy.contains('button', 'Отправить запрос хранителю').should('be.disabled');
    cy.get('#familySlug').clear().type('valid-family');
    cy.contains('button', 'Отправить запрос хранителю').should('not.be.disabled');
  });

  it('disables recovery confirm until requestId, otp and passwords valid', () => {
    cy.task('flushE2eRedis');
    cy.clearAllCookies();
    const phoneDigits = `900${String(Date.now()).slice(-7)}`;
    cy.task('seedRecoverySentFlow', { familySlug: 'e2e-recovery', phoneDigits }).then(
      ({ fid, flowCookieName }) => {
        cy.setCarelinkFlowCookie(fid, flowCookieName);
      },
    );
    cy.visit('/login/recovery/confirm');
    cy.contains('button', 'Сохранить и войти').should('be.disabled');
    cy.get('#requestId').type('req-abc-123');
    cy.fillOtp('123456');
    cy.get('#newPassword').type('Validpass1', { log: false });
    cy.contains('button', 'Сохранить и войти').should('be.disabled');
    cy.get('#confirmPassword').type('Validpass1', { log: false });
    cy.contains('button', 'Сохранить и войти').should('not.be.disabled');
  });
});
