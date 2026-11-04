describe('family-join R2', () => {
  it('[R2] QR с аккаунтом без семьи — pending copy', () => {
    cy.seedJoinFlow({
      step: 'pending',
      joinKeeperDisplayName: 'Слава',
    });
    cy.visit('/join/pending');
    cy.contains('Ждём подтверждения от Слава').should('be.visible');
  });
});
