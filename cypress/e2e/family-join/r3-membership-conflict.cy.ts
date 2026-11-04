describe('family-join R3', () => {
  it('[R3] уже в другой семье — экран недоступности', () => {
    cy.visit('/join/unavailable?reason=already_in_family');
    cy.contains('Вы уже в другой семье').should('be.visible');
    cy.contains('выйдите из текущей семьи').should('be.visible');
  });
});
