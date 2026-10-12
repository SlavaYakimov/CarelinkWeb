/**
 * Member invites compose — happy path matrix E1–E6, E12, E14.
 * Run: pnpm test:e2e:compose:invites
 */

type KeeperBundle = {
  email: string;
  workspaceSlug: string;
  workspaceEmail: string;
  phoneDigits: string;
  password: string;
  displayName: string;
  familyId: string;
  gatewayUrl: string;
  access: string;
  roleTemplateId: string;
};

function seedKeeper(ts: number): Cypress.Chainable<KeeperBundle> {
  cy.task('flushE2eRedis');
  return cy.composeOnboardingCreateFamily(ts).then((family) => {
    return cy.invitesResolveKeeperContext(family).then((ctx) => {
      const bundle: KeeperBundle = { ...family, ...ctx };
      return cy.wrap(bundle);
    });
  });
}

describe('invites compose happy path', () => {
  before(function () {
    cy.skipUnlessCompose();
  });

  it('E12: public /invite saves flow and redirects to login with next=/invites', () => {
    cy.task('flushE2eRedis');
    cy.visit('/invite?code=e2ecomposecode12345');
    cy.contains('h1', 'Вас пригласили в Carelink').should('be.visible');
    cy.contains('button', 'Войти').click();
    cy.location('pathname').should('eq', '/login');
    cy.assertLoginNextParam('/invites');
  });

  it('E1: keeper creates invite for new email → screen 18', () => {
    const ts = Date.now();
    const inviteEmail = `e2e.invite.new.${ts}@example.com`;
    const invitePhone = `901${String(ts).slice(-7)}`;

    seedKeeper(ts).then((keeper) => {
      cy.invitesSignInShortcut(keeper.workspaceEmail, keeper.password);
      cy.invitesOpenNewForm(keeper.familyId);
      cy.invitesFillForm({
        displayName: 'E2E Новый',
        personalEmail: inviteEmail,
        phoneDigits: invitePhone,
        waitLookup: 'new',
      });
      cy.invitesSubmitForm();
      cy.location('pathname', { timeout: 45_000 }).should(
        'eq',
        `/families/${keeper.familyId}/invites/sent`,
      );
      cy.location('search').should('include', 'kind=new');
      cy.contains('временный пароль').should('be.visible');
    });
  });

  it('E2: keeper invites existing Carelink user → screen 19', () => {
    const ts = Date.now();
    const keeperTs = ts;
    const inviteeTs = ts + 1;
    const inviteeEmail = `e2e+${inviteeTs}@example.com`;

    seedKeeper(keeperTs).then((keeper) => {
      cy.composeOnboardingCreateFamily(inviteeTs);
      cy.invitesSignInShortcut(keeper.workspaceEmail, keeper.password);
      cy.invitesOpenNewForm(keeper.familyId);
      cy.invitesFillForm({
        displayName: 'E2E Existing',
        personalEmail: inviteeEmail,
        phoneDigits: `902${String(inviteeTs).slice(-7)}`,
        waitLookup: 'existing',
      });
      cy.invitesSubmitForm();
      cy.location('pathname', { timeout: 45_000 }).should(
        'eq',
        `/families/${keeper.familyId}/invites/sent`,
      );
      cy.location('search').should('include', 'kind=existing');
      cy.contains('7 дней').should('be.visible');
    });
  });

  it('E3: lookup shows new vs registered hints on form 17', () => {
    const ts = Date.now();
    const newEmail = `e2e.lookup.new.${ts}@example.com`;
    const existingEmail = `e2e+${ts + 99}@example.com`;

    seedKeeper(ts).then((keeper) => {
      cy.composeOnboardingCreateFamily(ts + 99);
      cy.invitesSignInShortcut(keeper.workspaceEmail, keeper.password);
      cy.invitesOpenNewForm(keeper.familyId);
      cy.get('#personalEmail').clear().type(newEmail);
      cy.contains('Новый пользователь', { timeout: 20_000 }).should('be.visible');
      cy.get('#personalEmail').clear().type(existingEmail);
      cy.contains('Уже в Carelink', { timeout: 20_000 }).should('be.visible');
    });
  });

  it('E4: family invite list empty → row after invite', () => {
    const ts = Date.now();
    const inviteEmail = `e2e.list.${ts}@example.com`;

    seedKeeper(ts).then((keeper) => {
      cy.invitesSignInShortcut(keeper.workspaceEmail, keeper.password);
      cy.visit(`/families/${keeper.familyId}/invites`);
      cy.contains('Пока никого не пригласили').should('be.visible');
      cy.contains('a', 'Пригласить').click();
      cy.invitesFillForm({
        displayName: 'E2E List',
        personalEmail: inviteEmail,
        phoneDigits: `903${String(ts).slice(-7)}`,
        waitLookup: 'new',
      });
      cy.invitesSubmitForm();
      cy.visit(`/families/${keeper.familyId}/invites`);
      cy.contains('E2E List', { timeout: 30_000 }).should('be.visible');
      cy.contains('Отправлено').should('be.visible');
    });
  });

  it('E5: invitee accepts pending invite → families home (session rebuild)', () => {
    const ts = Date.now();
    const inviteeTs = ts + 2;
    const inviteeEmail = `e2e+${inviteeTs}@example.com`;

    seedKeeper(ts).then((keeper) => {
      cy.composeOnboardingCreateFamily(inviteeTs).then((invitee) => {
        cy.task('invitesSeedPendingExisting', {
          keeper,
          inviteeEmail,
          inviteePhoneDigits: invitee.phoneDigits,
          displayName: 'E2E Accept',
        }).then((seed) => {
          cy.clearAllCookies();
          cy.composeSignInViaSms(invitee.workspaceEmail, invitee.password, invitee.phoneDigits);
          cy.visit('/invites');
          cy.contains(keeper.familyName, { timeout: 30_000 }).should('be.visible');
          cy.contains('button', 'Принять').click();
          cy.location('pathname', { timeout: 45_000 }).should('eq', '/families');
          cy.contains('h1', 'Мои семьи').should('be.visible');
          cy.contains(keeper.familyName).should('be.visible');
          cy.wrap(seed.inviteId).should('be.a', 'string');
        });
      });
    });
  });

  it('E6: invitee declines pending invite', () => {
    const ts = Date.now();
    const inviteeTs = ts + 3;
    const inviteeEmail = `e2e+${inviteeTs}@example.com`;

    seedKeeper(ts).then((keeper) => {
      cy.composeOnboardingCreateFamily(inviteeTs).then((invitee) => {
        cy.task('invitesSeedPendingExisting', {
          keeper,
          inviteeEmail,
          inviteePhoneDigits: invitee.phoneDigits,
        });
        cy.clearAllCookies();
        cy.composeSignInViaSms(invitee.workspaceEmail, invitee.password, invitee.phoneDigits);
        cy.visit('/invites');
        cy.contains('button', 'Отклонить').click();
        cy.contains('Отклонено', { timeout: 20_000 }).should('be.visible');
      });
    });
  });

  it('E14: resend issues new temp password email for new invitee', () => {
    const ts = Date.now();
    const inviteEmail = `e2e.resend.${ts}@example.com`;
    const invitePhone = `904${String(ts).slice(-7)}`;

    seedKeeper(ts).then((keeper) => {
      cy.invitesSignInShortcut(keeper.workspaceEmail, keeper.password);
      cy.invitesOpenNewForm(keeper.familyId);
      cy.invitesFillForm({
        displayName: 'E2E Resend',
        personalEmail: inviteEmail,
        phoneDigits: invitePhone,
        waitLookup: 'new',
      });
      cy.invitesSubmitForm();
      cy.task('invitesFetchMemberEmail', { to: inviteEmail, skipPriorMatches: 0 }).then((first) => {
        cy.visit(`/families/${keeper.familyId}/invites`);
        cy.contains('E2E Resend').should('be.visible');
        cy.contains('button', 'Отправить снова').click();
        cy.contains('Письмо отправлено', { timeout: 30_000 }).should('be.visible');
        cy.task('invitesFetchMemberEmail', { to: inviteEmail, skipPriorMatches: 1 }).then(
          (second) => {
            expect(first.tempPassword).to.be.a('string');
            expect(second.tempPassword).to.be.a('string');
            expect(second.tempPassword).to.not.eq(first.tempPassword);
          },
        );
      });
    });
  });
});
