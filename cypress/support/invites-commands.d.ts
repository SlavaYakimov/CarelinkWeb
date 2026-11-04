export {};

declare global {
  namespace Cypress {
    interface Chainable {
      invitesResolveKeeperContext(keeper: {
        workspaceEmail: string;
        password: string;
        phoneDigits: string;
        email?: string;
      }): Chainable<{
        gatewayUrl: string;
        access: string;
        familyId: string;
        familyName: string;
        roleTemplateId: string;
      }>;
      invitesSignInShortcut(workspaceEmail: string, password: string): Chainable<void>;
      assertLoginNextParam(expectedNext: string): Chainable<void>;
      invitesOpenNewForm(familyId: string): Chainable<void>;
      invitesFillForm(fields: {
        displayName: string;
        personalEmail: string;
        phoneDigits: string;
        waitLookup?: 'new' | 'existing';
      }): Chainable<void>;
      invitesSubmitForm(): Chainable<void>;
    }
  }
}
