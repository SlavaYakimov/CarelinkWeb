describe('family-join R7', () => {
  it('[R7] автотранслит slug на экране создания семьи', () => {
    cy.seedJoinFlow({
      step: 'create-family',
      joinUserRefresh: 'test-refresh',
    });
    cy.visit('/join/create-family');
    cy.contains('h1', 'Создать семью').should('be.visible');
    cy.get('#family-name').type('Семья Якимовых');
    cy.get('#family-slug').should('not.have.value', '');
    cy.contains('carelink.app/').should('be.visible');
  });
});
