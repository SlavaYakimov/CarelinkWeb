/**
 * Negative / boundary: login + family recovery (CarelinkAuth compose BE-21).
 * Run: CYPRESS_E2E_COMPOSE=1 — spec cypress/e2e/_compose/login-and-forgot-password.negative.cy.ts
 */

type RecoveryFamilyCtx = {
  familySlug: string;
  phoneDigits: string;
  workspaceEmail: string;
};

/** Env fixture (yakimovs) or fresh family from onboarding — same as happy recovery spec. */
function withRecoveryFamilyCtx(fn: (ctx: RecoveryFamilyCtx) => void): void {
  const envPhone = Cypress.expose('recoveryPhoneDigits') as string;
  const envWorkspace = Cypress.expose('recoveryWorkspaceEmail') as string;
  if (envPhone) {
    fn({
      phoneDigits: envPhone,
      familySlug: envWorkspace.split('@')[0] ?? 'yakimovs',
      workspaceEmail: envWorkspace,
    });
    return;
  }
  const ts = Date.now();
  cy.composeOnboardingCreateFamily(ts).then((family) => {
    cy.clearCarelinkCookie('cl_sid');
    fn({
      phoneDigits: family.phoneDigits,
      familySlug: family.workspaceSlug,
      workspaceEmail: family.workspaceEmail,
    });
  });
}

function advanceToRecoveryConfirm(familySlug: string, phoneDigits: string): void {
  cy.visitLogin();
  cy.openLoginRecoveryFromForgotLink();
  cy.submitRecoveryRequest(familySlug, phoneDigits);
  cy.assertRecoverySentPage();
  cy.openRecoveryConfirmFromSent();
}

describe('login and forgot password — negative (compose BE-21)', () => {
  before(function () {
    if (!Cypress.expose('E2E_COMPOSE')) {
      this.skip();
    }
  });

  beforeEach(() => {
    cy.task('flushE2eRedis');
    cy.clearAllCookies();
  });

  it('lands on sent after recovery request without asserting stale recovery fields (R-2)', () => {
    withRecoveryFamilyCtx(({ familySlug, phoneDigits }) => {
      cy.visitLogin();
      cy.openLoginRecoveryFromForgotLink();
      cy.get('#familySlug').clear().type(familySlug);
      cy.get('#phone').clear().type(phoneDigits);
      cy.contains('button', 'Отправить запрос хранителю').click();
      cy.location('pathname', { timeout: 30_000 }).should('eq', '/login/recovery/sent');
      cy.contains('Запрос отправлен').should('be.visible');
    });
  });

  it('anti-enumeration: unknown family still reaches sent (R-18)', () => {
    withRecoveryFamilyCtx(({ phoneDigits }) => {
      cy.visit('/login/recovery');
      cy.submitRecoveryRequest(`no-such-${Date.now()}`, phoneDigits);
      cy.assertRecoverySentPage();
    });
  });

  it('rejects confirm field validation without gateway success (R-12)', () => {
    withRecoveryFamilyCtx(({ familySlug, phoneDigits }) => {
    advanceToRecoveryConfirm(familySlug, phoneDigits);
    cy.get('#requestId').clear().type('not-a-uuid');
    cy.fillOtp('123456');
    cy.get('#newPassword').clear().type('short7', { log: false });
    cy.get('#confirmPassword').clear().type('short7', { log: false });
    cy.contains('button', 'Сохранить и войти').click();
    cy.location('pathname').should('eq', '/login/recovery/confirm');
    cy.contains('[role="alert"]', 'Укажите идентификатор из SMS').should('be.visible');
    cy.contains('[role="alert"]', 'Не короче 8 символов').should('be.visible');
    });
  });

  it('rejects mismatched passwords on confirm (R-12)', () => {
    withRecoveryFamilyCtx(({ familySlug, phoneDigits }) => {
    const requestId = '00000000-0000-4000-8000-000000000002';

    advanceToRecoveryConfirm(familySlug, phoneDigits);
    cy.get('#requestId').clear().type(requestId);
    cy.fillOtp('123456');
    cy.get('#newPassword').clear().type('Testpass1', { log: false });
    cy.get('#confirmPassword').clear().type('Testpass2', { log: false });
    cy.contains('button', 'Сохранить и войти').click();
    cy.location('pathname').should('eq', '/login/recovery/confirm');
    cy.contains('[role="alert"]', 'Пароли не совпадают').should('be.visible');
    });
  });

  it('accepts six-digit OTP via fillOtp on confirm (R-13, R-31)', () => {
    withRecoveryFamilyCtx(({ familySlug, phoneDigits }) => {
    advanceToRecoveryConfirm(familySlug, phoneDigits);
    cy.fillOtp('654321');
    const digits = '654321';
    for (let i = 1; i <= 6; i += 1) {
      cy.get(`[aria-label="Цифра ${i} из 6"]`).should('have.value', digits[i - 1]);
    }
    });
  });

  it('sends at most two confirm action POSTs on double click while pending (R-22)', () => {
    withRecoveryFamilyCtx(({ familySlug, phoneDigits }) => {
    const requestId = '00000000-0000-4000-8000-000000000004';

    advanceToRecoveryConfirm(familySlug, phoneDigits);
    cy.intercept('POST', '**/login/recovery/confirm', (req) => {
      req.reply((res) => {
        res.delay = 800;
        res.send();
      });
    }).as('confirmPost');
    cy.get('#requestId').clear().type(requestId);
    cy.fillOtp('111111');
    cy.get('#newPassword').clear().type('Testpass1', { log: false });
    cy.get('#confirmPassword').clear().type('Testpass1', { log: false });
    cy.contains('button', 'Сохранить и войти').dblclick();
    cy.get('@confirmPost.all', { timeout: 10_000 }).then((interceptions) => {
      expect(interceptions.length).to.be.at.most(2);
    });
    cy.location('pathname').should('eq', '/login/recovery/confirm');
    });
  });

  it('shows gateway error on invalid confirm without leaving confirm (R-20)', () => {
    withRecoveryFamilyCtx(({ familySlug, phoneDigits }) => {
    const requestId = '00000000-0000-4000-8000-000000000003';

    advanceToRecoveryConfirm(familySlug, phoneDigits);
    cy.submitRecoveryConfirm(requestId, '000000', 'Testpass1');
    cy.location('pathname').should('eq', '/login/recovery/confirm');
    cy.get('[role="alert"]').should('be.visible');
    cy.contains('button', 'Сохранить и войти').should('not.be.disabled');
    });
  });

  it('sends at most two recovery request action POSTs on double click (R-21)', () => {
    withRecoveryFamilyCtx(({ familySlug, phoneDigits }) => {
    cy.intercept('POST', '**/login/recovery').as('recoveryPost');
    cy.visit('/login/recovery');
    cy.get('#familySlug').clear().type(familySlug);
    cy.get('#phone').clear().type(phoneDigits);
    cy.contains('button', 'Отправить запрос хранителю').dblclick();
    cy.assertRecoverySentPage();
    cy.get('@recoveryPost.all', { timeout: 5_000 }).then((interceptions) => {
      expect(interceptions.length).to.be.at.most(2);
    });
    });
  });

  it('redirects /login to /families when session already active (R-6)', () => {
    const ts = Date.now();
    const newPassword = `Testpass${ts}`;
    cy.composeOnboardingCreateFamily(ts).then((family) => {
      cy.completeRecoveryToFamilies(family, newPassword, {
        keeperWorkspaceEmail: family.workspaceEmail,
        keeperPassword: family.password,
      });
      cy.visit('/login');
      cy.location('pathname', { timeout: 15_000 }).should('eq', '/families');
    });
  });

  it('allows second workspace login after clearing cookie (R-8)', () => {
    const ts = Date.now();
    const newPassword = `Testpass${ts}`;
    cy.composeOnboardingCreateFamily(ts).then((family) => {
      cy.completeRecoveryToFamilies(family, newPassword, {
        keeperWorkspaceEmail: family.workspaceEmail,
        keeperPassword: family.password,
      });
      cy.clearCarelinkCookie('cl_sid');
      cy.visitLogin();
      cy.fillWorkspaceLogin(family.workspaceEmail, newPassword);
      cy.location('pathname', { timeout: 30_000 }).should('eq', '/families');
      cy.clearCarelinkCookie('cl_sid');
      cy.visitLogin();
      cy.fillWorkspaceLogin(family.workspaceEmail, newPassword);
      cy.location('pathname', { timeout: 30_000 }).should('eq', '/families');
    });
  });

  it('redirects repeat visit to confirm after successful recovery (R-23)', () => {
    const ts = Date.now();
    const newPassword = `Testpass${ts}`;
    cy.composeOnboardingCreateFamily(ts).then((family) => {
      cy.completeRecoveryToFamilies(family, newPassword, {
        keeperWorkspaceEmail: family.workspaceEmail,
        keeperPassword: family.password,
      });
      cy.visit('/login/recovery/confirm');
      cy.location('pathname', { timeout: 15_000 }).should('eq', '/login/recovery');
    });
  });

  it('redirects repeat visit to sent after confirm clears flow (R-24)', () => {
    const ts = Date.now();
    const newPassword = `Testpass${ts}`;
    cy.composeOnboardingCreateFamily(ts).then((family) => {
      cy.completeRecoveryToFamilies(family, newPassword, {
        keeperWorkspaceEmail: family.workspaceEmail,
        keeperPassword: family.password,
      });
      cy.visit('/login/recovery/sent');
      cy.location('pathname', { timeout: 15_000 }).should('eq', '/login/recovery');
    });
  });

  it('shows expired-code message on second confirm with same OTP (R-19)', () => {
    const ts = Date.now();
    const newPassword = `Testpass${ts}`;
    cy.composeOnboardingCreateFamily(ts).then((family) => {
      const familySlug = family.workspaceSlug;
      cy.clearCarelinkCookie('cl_sid');
      cy.visitLogin();
      cy.openLoginRecoveryFromForgotLink();
      cy.submitRecoveryRequest(familySlug, family.phoneDigits);
      cy.assertRecoverySentPage();
      cy.openRecoveryConfirmFromSent();
      cy.task<{ requestId: string; smsCode: string }>('approveRecoveryRequest', {
        phoneDigits: family.phoneDigits,
        keeperWorkspaceEmail: family.workspaceEmail,
        keeperPassword: family.password,
      }).then(({ requestId, smsCode }) => {
        cy.submitRecoveryConfirm(requestId, smsCode, newPassword);
        cy.location('pathname', { timeout: 30_000 }).should('eq', '/families');
        cy.clearCarelinkCookie('cl_sid');
        cy.task('seedRecoverySentFlow', {
          familySlug,
          phoneDigits: family.phoneDigits,
        }).then(({ fid, flowCookieName }) => {
          cy.setCarelinkFlowCookie(fid, flowCookieName);
        });
        cy.visit('/login/recovery/confirm');
        cy.submitRecoveryConfirm(requestId, smsCode, `Other${newPassword}`);
        cy.location('pathname').should('eq', '/login/recovery/confirm');
        cy.contains('[role="alert"]', 'Код использован или истёк').should('be.visible');
      });
    });
  });
});
