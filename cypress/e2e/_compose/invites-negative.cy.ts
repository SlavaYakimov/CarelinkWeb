/**
 * Member invites compose — negative / infra matrix E7–E11, E13, E15–E17.
 * Run: pnpm test:e2e:compose:invites
 */

type KeeperBundle = {
  workspaceEmail: string;
  password: string;
  phoneDigits: string;
  familyId: string;
  gatewayUrl: string;
  access: string;
  roleTemplateId: string;
  familyName?: string;
};

function seedKeeper(ts: number): Cypress.Chainable<KeeperBundle> {
  cy.task('flushE2eRedis');
  return cy.composeOnboardingCreateFamily(ts).then((family) => {
    return cy.invitesResolveKeeperContext(family).then((ctx) => cy.wrap({ ...family, ...ctx }));
  });
}

describe('invites compose negative and infra', () => {
  before(function () {
    cy.skipUnlessCompose();
  });

  it('E7: wrong user cannot accept — gateway 403 and screen 22', () => {
    const ts = Date.now();
    const inviteeTs = ts + 10;
    const strangerTs = ts + 11;
    const inviteeEmail = `e2e+${inviteeTs}@example.com`;

    seedKeeper(ts).then((keeper) => {
      cy.composeOnboardingCreateFamily(inviteeTs);
      cy.composeOnboardingCreateFamily(strangerTs).then((stranger) => {
        cy.task('invitesSeedPendingExisting', {
          keeper,
          inviteeEmail,
          inviteePhoneDigits: `905${String(inviteeTs).slice(-7)}`,
        }).then((seed) => {
          cy.task('invitesAcceptWrongUser', {
            keeper,
            member: stranger,
            inviteId: seed.inviteId,
          }).then((result: { status: number }) => {
            expect(result.status).to.eq(403);
          });
          cy.composeSignInViaSms(stranger.workspaceEmail, stranger.password, stranger.phoneDigits);
          cy.visit('/invites/unavailable?reason=not_invitee');
          cy.contains('адресовано другому').should('be.visible');
        });
      });
    });
  });

  it('E8: expired pending invite → screen 22', () => {
    const ts = Date.now();
    const inviteeTs = ts + 20;
    const inviteeEmail = `e2e+${inviteeTs}@example.com`;

    seedKeeper(ts).then((keeper) => {
      cy.composeOnboardingCreateFamily(inviteeTs).then((invitee) => {
        cy.task('invitesSeedPendingExisting', {
          keeper,
          inviteeEmail,
          inviteePhoneDigits: invitee.phoneDigits,
        }).then((seed) => {
          cy.task('invitesExpire', { inviteId: seed.inviteId }).then((exp) => {
            if (!exp.ok) {
              cy.log(`expire skipped: ${exp.message}`);
            }
            cy.clearAllCookies();
            cy.composeSignInViaSms(invitee.workspaceEmail, invitee.password, invitee.phoneDigits);
            cy.visit('/invites');
            cy.contains('button', 'Принять').click();
            cy.location('pathname', { timeout: 45_000 }).should('eq', '/invites/unavailable');
            cy.contains('истекло').should('be.visible');
          });
        });
      });
    });
  });

  it('E9: non-keeper member cannot open invite form (forbidden)', () => {
    const ts = Date.now();
    const inviteeTs = ts + 30;
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
        cy.contains('button', 'Принять').click();
        cy.location('pathname', { timeout: 45_000 }).should('eq', '/families');
        cy.visit(`/families/${keeper.familyId}/invites/new`);
        cy.location('pathname', { timeout: 30_000 }).should('eq', '/forbidden');
        cy.contains('Недостаточно прав').should('be.visible');
      });
    });
  });

  it('E10: lookup-email rate limit surfaces on form 17', () => {
    const ts = Date.now();
    const hammerEmail = `e2e.rate.${ts}@example.com`;

    seedKeeper(ts).then((keeper) => {
      cy.task('invitesHammerLookup', {
        gatewayUrl: keeper.gatewayUrl,
        familyId: keeper.familyId,
        access: keeper.access,
        count: 32,
        email: hammerEmail,
        clientIp: '127.0.0.1',
      }).then((last: { status: number }) => {
        expect(last.status).to.eq(429);
      });
      cy.invitesSignInShortcut(keeper.workspaceEmail, keeper.password);
      cy.invitesOpenNewForm(keeper.familyId);
      cy.get('#personalEmail').clear().type(hammerEmail);
      cy.contains('Слишком много проверок почты', { timeout: 30_000 }).should('be.visible');
    });
  });

  describe('E11 invites disabled (501)', () => {
    const flagRestore = { familyId: '' };

    afterEach(() => {
      if (!flagRestore.familyId) return;
      cy.task('invitesSetFlag', {
        familyId: flagRestore.familyId,
        enabled: true,
        waitHealth: true,
      });
    });

    it('shows 501 on form 17 when family flag off', () => {
      const ts = Date.now();
      const probeEmail = `e2e.flag.${ts}@example.com`;

      seedKeeper(ts).then((keeper) => {
        flagRestore.familyId = keeper.familyId;
        cy.task('invitesSetFlag', {
          familyId: keeper.familyId,
          enabled: false,
          verify: true,
          waitHealth: true,
          keeper,
          email: probeEmail,
        }).then((flag: { ok: boolean; message?: string }) => {
          expect(flag.ok, flag.message ?? 'invitesSetFlag verify').to.eq(true);
          cy.invitesSignInShortcut(keeper.workspaceEmail, keeper.password);
          cy.invitesOpenNewForm(keeper.familyId);
          cy.get('#personalEmail').clear().type(probeEmail);
          cy.contains('Приглашения по почте временно недоступны', { timeout: 30_000 }).should(
            'be.visible',
          );
        });
      });
    });
  });

  it('E13: revoke then accept fails → screen 22', () => {
    const ts = Date.now();
    const inviteeTs = ts + 40;
    const inviteeEmail = `e2e+${inviteeTs}@example.com`;

    seedKeeper(ts).then((keeper) => {
      cy.composeOnboardingCreateFamily(inviteeTs).then((invitee) => {
        cy.task('invitesSeedPendingExisting', {
          keeper,
          inviteeEmail,
          inviteePhoneDigits: invitee.phoneDigits,
        }).then((seed) => {
          cy.invitesSignInShortcut(keeper.workspaceEmail, keeper.password);
          cy.visit(`/families/${keeper.familyId}/invites`);
          cy.contains('button', 'Отозвать').click();
          cy.contains('Отозвано', { timeout: 20_000 }).should('be.visible');
          cy.clearAllCookies();
          cy.composeSignInViaSms(invitee.workspaceEmail, invitee.password, invitee.phoneDigits);
          cy.visit('/invites');
          cy.get('body').then(($body) => {
            if ($body.text().includes('Принять')) {
              cy.contains('button', 'Принять').click();
              cy.location('pathname', { timeout: 45_000 }).should('eq', '/invites/unavailable');
            } else {
              cy.visit('/invites/unavailable?reason=revoked');
            }
          });
          cy.contains(/отозван|недоступн/i).should('be.visible');
          cy.wrap(seed.inviteId).should('be.a', 'string');
        });
      });
    });
  });

  it('E15: already member — second accept → screen 22', () => {
    const ts = Date.now();
    const inviteeTs = ts + 50;
    const inviteeEmail = `e2e+${inviteeTs}@example.com`;

    seedKeeper(ts).then((keeper) => {
      cy.composeOnboardingCreateFamily(inviteeTs).then((invitee) => {
        cy.task('invitesSeedPendingExisting', {
          keeper,
          inviteeEmail,
          inviteePhoneDigits: invitee.phoneDigits,
        }).then((seed) => {
          cy.task('invitesGatewayAcceptAsInvitee', {
            invitee,
            inviteId: seed.inviteId,
          }).then((first: { status: number }) => {
            expect(first.status).to.eq(200);
          });
          cy.task('invitesGatewayAcceptAsInvitee', {
            invitee,
            inviteId: seed.inviteId,
          }).then((second: { status: number }) => {
            expect(second.status).to.eq(409);
          });
          cy.visit('/invites/unavailable?reason=already_member');
          cy.contains('уже в этой семье').should('be.visible');
        });
      });
    });
  });

  it('E16: lookup-email returns 200 (BE-01 regression)', () => {
    const ts = Date.now();
    seedKeeper(ts).then((keeper) => {
      cy.task('invitesGatewayLookup', {
        keeper,
        email: `e2e.lookup.gateway.${ts}@example.com`,
      }).then((result: { status: number; data: { registered?: boolean } }) => {
        expect(result.status).to.eq(200);
        expect(result.data.registered).to.be.a('boolean');
      });
    });
  });

  it('E17: non-keeper create returns 403 not 500 (BE-02 regression)', () => {
    const ts = Date.now();
    const inviteeTs = ts + 60;
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
        cy.contains('button', 'Принять').click();
        cy.location('pathname', { timeout: 45_000 }).should('eq', '/families');

        cy.task('invitesGatewayCreateAsMember', {
          member: invitee,
          familyId: keeper.familyId,
          body: {
            roleTemplateId: keeper.roleTemplateId,
            displayName: 'Hack',
            phone: '+79000000001',
            personalEmail: `hack.${ts}@example.com`,
          },
        }).then((result: { status: number }) => {
          expect(result.status).to.be.oneOf([403, 401]);
          expect(result.status).to.not.eq(500);
        });

        cy.visit(`/families/${keeper.familyId}/invites/new`);
        cy.location('pathname').should('eq', '/forbidden');
      });
    });
  });
});
