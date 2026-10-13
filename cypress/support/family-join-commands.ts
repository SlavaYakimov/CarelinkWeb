import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const seedScript = path.join(__dirname, '../../scripts/e2e/seed-join-flow.mjs');

Cypress.Commands.add('seedJoinFlow', (flow: Record<string, unknown>) => {
  cy.wrap(null).then(async () => {
    const { stdout } = await execFileAsync(process.execPath, [seedScript, JSON.stringify(flow)], {
      env: process.env,
    });
    const { fid, flowCookieName } = JSON.parse(stdout.trim()) as {
      fid: string;
      flowCookieName: string;
    };
    cy.setCarelinkFlowCookie(fid, flowCookieName);
  });
});
