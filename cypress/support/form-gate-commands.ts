/** Assert client gating: submit stays disabled and inline error appears after blur. */
Cypress.Commands.add(
  'assertGatedValidation',
  (options: { submitLabel: string; errorText: string; blurSelector: string }) => {
    cy.contains('button', options.submitLabel).should('be.disabled');
    cy.get(options.blurSelector).then(($el) => {
      const el = $el[0];
      el.focus();
      el.blur();
    });
    cy.contains(options.errorText).should('be.visible');
  },
);

Cypress.Commands.add(
  'clickSubmitWhenEnabled',
  (label: string | RegExp, timeout = 15_000) => {
    cy.contains('button', label, { timeout }).should('be.enabled').click();
  },
);
