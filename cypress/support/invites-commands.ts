type KeeperFixture = {
  workspaceEmail: string;
  password: string;
  phoneDigits: string;
  email?: string;
};

type KeeperGatewayContext = {
  gatewayUrl: string;
  access: string;
  familyId: string;
  familyName: string;
  roleTemplateId: string;
};

Cypress.Commands.add('invitesResolveKeeperContext', (keeper: KeeperFixture) => {
  return cy.task<KeeperGatewayContext>('invitesResolveKeeperContext', keeper);
});

Cypress.Commands.add('invitesSignInShortcut', (workspaceEmail: string, password: string) => {
  cy.clearCarelinkCookie('cl_sid');
  cy.visit('/login');
  cy.get('input[name="trustDevice"]').check();
  cy.fillWorkspaceLogin(workspaceEmail, password);
  cy.location('pathname', { timeout: 45_000 }).should('eq', '/families');
  cy.contains('h1', 'Мои семьи').should('be.visible');
});

Cypress.Commands.add('assertLoginNextParam', (expectedNext: string) => {
  cy.location('search').then((search) => {
    const raw = search.startsWith('?') ? search.slice(1) : search;
    const params = new URLSearchParams(raw);
    expect(params.get('next')).to.eq(expectedNext);
  });
});

Cypress.Commands.add('invitesOpenNewForm', (familyId: string) => {
  cy.visit(`/families/${familyId}/invites/new`);
  cy.contains('h1', 'Пригласить участника').should('be.visible');
});

Cypress.Commands.add(
  'invitesFillForm',
  (fields: {
    displayName: string;
    personalEmail: string;
    phoneDigits: string;
    waitLookup?: 'new' | 'existing';
  }) => {
    cy.get('#displayName').clear().type(fields.displayName);
    cy.get('#personalEmail').clear().type(fields.personalEmail);
    cy.get('#phone').clear().type(fields.phoneDigits);
    if (fields.waitLookup === 'new') {
      cy.contains('Новый пользователь', { timeout: 20_000 }).should('be.visible');
    }
    if (fields.waitLookup === 'existing') {
      cy.contains('Уже в Carelink', { timeout: 20_000 }).should('be.visible');
    }
  },
);

Cypress.Commands.add('invitesSubmitForm', () => {
  cy.clickSubmitWhenEnabled('Отправить приглашение');
});
