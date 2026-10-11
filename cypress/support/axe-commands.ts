import fs from 'node:fs';
import path from 'node:path';

type AxeRunOptions = {
  includedImpacts?: string[];
  [key: string]: unknown;
};

const axeMinPath = path.join(process.cwd(), 'node_modules/axe-core/axe.min.js');
let cachedAxeSource: string | null = null;

function getAxeSource(): string {
  if (!cachedAxeSource) {
    cachedAxeSource = fs.readFileSync(axeMinPath, 'utf8');
  }
  return cachedAxeSource;
}

function injectAxeIntoWindow(win: Window & typeof globalThis): void {
  if (win.axe) return;
  const script = win.document.createElement('script');
  script.text = getAxeSource();
  win.document.head.appendChild(script);
}

Cypress.Commands.add('injectAxe', () => {
  cy.window({ log: false }).then((win) => {
    injectAxeIntoWindow(win);
  });
});

Cypress.Commands.add('checkA11y', (context?: string | Node, options?: AxeRunOptions) => {
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
});
