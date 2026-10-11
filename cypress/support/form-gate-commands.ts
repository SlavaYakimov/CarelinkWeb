/** Assert client gating: submit stays disabled and inline error appears after blur. */
Cypress.Commands.add(
  'assertGatedValidation',
  (options: { submitLabel: string; errorText: string; blurSelector: string }) => {
    cy.contains('button', options.submitLabel).should('be.disabled');
    cy.get(options.blurSelector).blur();
    cy.contains(options.errorText).should('be.visible');
  },
);

Cypress.Commands.add('clickSubmitWhenEnabled', (label: string | RegExp) => {
  cy.contains('button', label).should('be.enabled').click();
});
