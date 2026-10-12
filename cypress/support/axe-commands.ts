type AxeRunOptions = {
  includedImpacts?: string[];
  [key: string]: unknown;
};

function injectAxeSource(win: Window & typeof globalThis, source: string): void {
  if (win.axe) return;
  const script = win.document.createElement('script');
  script.text = source;
  win.document.head.appendChild(script);
}

Cypress.Commands.add('injectAxe', () => {
  cy.task<string>('readAxeSource').then((source) => {
    cy.window({ log: false }).then((win) => {
      injectAxeSource(win, source);
    });
  });
});

Cypress.Commands.add('checkA11y', (context?: string | Node, options?: AxeRunOptions) => {
  cy.task<string>('readAxeSource').then((source) => {
    cy.window({ log: false }).then((win) => {
      injectAxeSource(win, source);
      const target = context ?? win.document;
      return win.axe.run(target, options).then((results) => {
        const impacts = options?.includedImpacts ?? ['serious', 'critical'];
        const violations = results.violations.filter((v) => impacts.includes(v.impact ?? 'minor'));
        if (violations.length > 0) {
          const summary = violations
            .map((v) => `${v.id}: ${v.description} (${v.nodes.length} nodes)`)
            .join('\n');
          throw new Error(`A11y violations:\n${summary}`);
        }
      });
    });
  });
});
