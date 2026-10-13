describe('family-join R1', () => {
  it('[R1] QR новый пользователь — ждём хранителя', () => {
    cy.seedJoinFlow({
      step: 'pending',
      joinKeeperDisplayName: 'Слава',
      displayName: 'Мама',
    });
    cy.visit('/join/pending');
    cy.contains('h1', 'Ждём хранителя').should('be.visible');
    cy.contains('Слава').should('be.visible');
  });
});
