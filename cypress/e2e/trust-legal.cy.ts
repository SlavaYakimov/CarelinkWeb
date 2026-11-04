describe('Trust and legal pages', () => {
  it('privacy and terms show draft notice in Russian', () => {
    cy.visit('/privacy');
    cy.injectAxe();
    cy.contains('Черновик для юристов').should('be.visible');
    cy.checkA11y(undefined, { includedImpacts: ['serious', 'critical'] });

    cy.visit('/terms');
    cy.contains('Черновик для юристов').should('be.visible');
    cy.checkA11y(undefined, { includedImpacts: ['serious', 'critical'] });
  });

  it('login footer links to privacy, terms, and help', () => {
    cy.visit('/login');
    cy.contains('a', 'Конфиденциальность').should('have.attr', 'href', '/privacy');
    cy.contains('a', 'Условия').should('have.attr', 'href', '/terms');
    cy.contains('a', 'Помощь').should('have.attr', 'href', '/help');
  });

  it('hides gateway debug badge on production build', () => {
    cy.visit('/login');
    cy.contains('Шлюз авторизации семейных сетей').should('not.exist');
  });

  it('returns 404 for dev kit in production server', () => {
    cy.request({ url: '/dev/kit', failOnStatusCode: false }).then((res) => {
      expect(res.status).to.eq(404);
    });
  });
});
