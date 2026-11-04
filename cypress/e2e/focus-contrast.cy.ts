describe('Focus and contrast (axe + touch targets)', () => {
  beforeEach(() => {
    cy.viewport(375, 812);
    cy.visit('/login');
    cy.injectAxe();
  });

  it('login form passes axe serious/critical', () => {
    cy.checkA11y(undefined, {
      includedImpacts: ['serious', 'critical'],
    });
  });

  it('password visibility control has at least 44px hit area', () => {
    cy.get('#password').type('longenough1');
    cy.get('button[aria-label="Показать пароль"]').then(($btn) => {
      const rect = $btn[0].getBoundingClientRect();
      expect(rect.width).to.be.at.least(44);
      expect(rect.height).to.be.at.least(44);
    });
  });

  it('trust-device row meets minimum touch height', () => {
    cy.contains('label', 'Доверять этому устройству').then(($label) => {
      const rect = $label[0].getBoundingClientRect();
      expect(rect.height).to.be.at.least(44);
    });
  });
});
