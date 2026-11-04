describe('family-join R4', () => {
  it('[R4] QR просрочен — invitee экран 51', () => {
    cy.visit('/join/unavailable?reason=expired');
    cy.contains('Приглашение устарело').should('be.visible');
    cy.contains('отправить новое').should('be.visible');
  });
});
