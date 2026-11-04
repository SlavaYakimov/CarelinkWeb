describe('family-join R5', () => {
  it('[R5] email код — выбор пути после регистрации', () => {
    cy.seedJoinFlow({
      step: 'choice',
      personalEmail: 'mama@example.com',
      joinUserRefresh: 'test-refresh',
    });
    cy.visit('/join/choice');
    cy.contains('h1', 'Почта подтверждена').should('be.visible');
    cy.contains('button', 'Создать семью').should('be.visible');
    cy.contains('button', 'Перейти к QR').should('be.visible');
  });

  it('[R5] email verify screen 53', () => {
    cy.seedJoinFlow({
      step: 'verify',
      personalEmail: 'mama@example.com',
    });
    cy.visit('/invites/email/verify');
    cy.contains('h1', 'Код из письма').should('be.visible');
    cy.contains('mama@example.com').should('be.visible');
  });
});
