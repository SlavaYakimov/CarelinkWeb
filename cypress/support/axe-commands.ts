import axe from 'axe-core';

type AxeRunOptions = Parameters<typeof axe.run>[1];

function injectAxeIntoWindow(win: Window & typeof globalThis): void {
  if (win.axe) return;
  const script = win.document.createElement('script');
  script.text = axe.source;
  win.document.head.appendChild(script);
}

Cypress.Commands.add('injectAxe', () => {
  cy.window({ log: false }).then((win) => {
    injectAxeIntoWindow(win);
  });
});

Cypress.Commands.add(
  'checkA11y',
  (context?: string | Node | axe.ElementContext, options?: AxeRunOptions) => {
    cy.window({ log: false }).then((win) => {
      injectAxeIntoWindow(win);
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
  },
);
