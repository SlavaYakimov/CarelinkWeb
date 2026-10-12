describe('App states (404, titles, offline banner)', () => {
  it('shows Russian not-found page', () => {
    cy.visit('/this-route-does-not-exist-carelink', { failOnStatusCode: false });
    cy.injectAxe();
    cy.contains('h1', 'Страница не найдена').should('be.visible');
    cy.contains('a', 'Мои семьи').should('have.attr', 'href', '/families');
    cy.checkA11y(undefined, {
      includedImpacts: ['serious', 'critical'],
    });
  });

  it('sets document title on login', () => {
    cy.visit('/login');
    cy.title().should('eq', 'Вход — Carelink');
  });

  it('shows offline banner when navigator reports offline', () => {
    cy.visit('/login');
    cy.window().then((win) => {
      const onlineStub = cy.stub(win.navigator, 'onLine').value(false);
      win.dispatchEvent(new Event('offline'));
      cy.contains('[role="status"]', 'Нет соединения').should('be.visible');
      cy.contains('button', 'Повторить').should('be.visible');
      onlineStub.restore();
      win.dispatchEvent(new Event('online'));
    });
    cy.contains('[role="status"]', 'Нет соединения').should('not.exist');
  });
});
