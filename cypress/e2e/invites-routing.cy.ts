describe('invites routing (no compose)', () => {
  it('shows public invite landing for valid code query', () => {
    cy.visit('/invite?code=cypressvalidcode12');
    cy.contains('h1', 'Вас пригласили в Carelink').should('be.visible');
  });

  it('redirects missing code to public unavailable', () => {
    cy.visit('/invite');
    cy.location('pathname').should('eq', '/invite/unavailable');
  });

  it('login next param parses encoded or plain', () => {
    cy.visit('/login?next=/invites');
    cy.assertLoginNextParam('/invites');
  });
});
