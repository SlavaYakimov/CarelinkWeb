Cypress.Commands.add('seedJoinFlow', (flow: Record<string, unknown>) => {
  cy.task<{ fid: string; flowCookieName: string }>('seedJoinFlow', flow).then(
    ({ fid, flowCookieName }) => {
      cy.setCarelinkFlowCookie(fid, flowCookieName);
    },
  );
});
