/**
 * Negative / boundary: workspace sign-in (`login` flow).
 * Production server only — see login-and-forgot-password.negative.cy.ts header.
 */

function setInvalidSessionCookie(sid: string) {
  // E2E CI sets COOKIE_PREFIX='' (web-check.yml); local .env usually matches.
  cy.setCookie('cl_sid', sid, { path: '/' });
}

describe('workspace login — negative (guest)', () => {
  beforeEach(() => {
    cy.task('flushE2eRedis');
    cy.clearAllCookies();
  });

  it('shows login shell with title, ids, and trust device checked (R-33, R-34, R-36)', () => {
    cy.visitLogin();
    cy.get('#workspaceSlug').should('be.visible');
    cy.get('#password').should('be.visible');
    cy.contains('h3', 'Вход в Carelink').should('be.visible');
    cy.contains('button', 'Войти').should('be.visible');
    cy.get('input[name="trustDevice"]').should('be.checked');
  });

  it('lands on the same login UI from / redirect and direct /login (R-5)', () => {
    cy.visit('/');
    cy.location('pathname').should('eq', '/login');
    cy.get('#workspaceSlug').should('be.visible');
    cy.contains('h3', 'Вход в Carelink').should('be.visible');

    cy.visitLogin();
    cy.get('#workspaceSlug').should('be.visible');
    cy.contains('h3', 'Вход в Carelink').should('be.visible');
  });

  it('rejects empty workspace slug (R-11)', () => {
    cy.visitLogin();
    cy.get('#workspaceSlug').clear().invoke('prop', 'required', false);
    cy.get('#password').clear().type('longenough', { log: false });
    cy.contains('button', 'Войти').click();
    cy.contains('[role="alert"]', 'Укажите адрес семьи').should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('rejects workspace slug shorter than 3 characters (R-12)', () => {
    cy.visitLogin();
    cy.get('#workspaceSlug').clear().type('ab');
    cy.get('#password').clear().type('longenough', { log: false });
    cy.contains('button', 'Войти').click();
    cy.contains('[role="alert"]', 'Адрес семьи не короче 3 символов').should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('rejects non-latin workspace slug (R-12)', () => {
    cy.visitLogin();
    cy.get('#workspaceSlug').clear().type('тест');
    cy.get('#password').clear().type('longenough', { log: false });
    cy.contains('button', 'Войти').click();
    cy.contains('[role="alert"]', 'Только латиница').should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('rejects workspace slug longer than 32 characters (R-12)', () => {
    cy.visitLogin();
    cy.get('#workspaceSlug').clear().type('a'.repeat(33));
    cy.get('#password').clear().type('longenough', { log: false });
    cy.contains('button', 'Войти').click();
    cy.contains('[role="alert"]', 'Слишком длинный адрес').should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('normalizes workspace email to slug on submit via fillWorkspaceLogin (R-15)', () => {
    cy.visitLogin();
    cy.fillWorkspaceLogin('yakimovs@workspaces.carelink.app', 'wrong-password-1');
    cy.get('#workspaceSlug').should('have.value', 'yakimovs');
    cy.location('pathname').should('eq', '/login');
  });

  it('trims surrounding spaces from workspace slug on submit (R-14)', () => {
    cy.visitLogin();
    cy.get('#workspaceSlug').clear().type('  yakimovs  ');
    cy.get('#password').clear().type('wrong-password-1', { log: false });
    cy.contains('button', 'Войти').click();
    cy.location('pathname').should('eq', '/login');
    cy.get('#workspaceSlug').should('have.value', 'yakimovs');
  });

  it('rejects password shorter than 8 characters (R-13)', () => {
    cy.visitLogin();
    cy.get('#workspaceSlug').clear().type('yakimovs');
    cy.get('#password').clear().type('short7', { log: false });
    cy.contains('button', 'Войти').click();
    cy.contains('[role="alert"]', 'Не короче 8 символов').should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('shows password hint without alert before submit (R-35)', () => {
    cy.visitLogin();
    cy.contains('Не короче 8 символов').should('be.visible');
    cy.get('[role="alert"]').should('not.exist');
  });

  it('redirects protected route to login when session cookie is absent (R-6)', () => {
    cy.visit('/families');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/login');
    cy.url().should('include', 'next=%2Ffamilies');
  });

  it('redirects /families to session-ended with invalid session cookie (R-7)', () => {
    setInvalidSessionCookie('e2e-invalid-session-sid');
    cy.visit('/families');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/session-ended');
  });

  it('redirects verify-sms to login without sign-in flow', () => {
    cy.visit('/login/verify-sms');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/login');
  });

  it('redirects verify-phone to login without sign-in flow', () => {
    cy.visit('/login/verify-phone');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/login');
  });

  it('redirects keeper to login without sign-in flow', () => {
    cy.visit('/login/keeper');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/login');
  });

  it('redirects verify-push to login without sign-in flow', () => {
    cy.visit('/login/verify-push');
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/login');
  });

  it('login page HTML does not expose JWT or deviceSession (R-38)', () => {
    cy.visitLogin();
    cy.document().its('documentElement.innerHTML').should('not.include', 'eyJ');
    cy.document().its('documentElement.innerHTML').should('not.include', 'deviceSession');
  });

  it('renders rate-limit screen when visiting too-many with retryAfter (R-19)', () => {
    cy.visit('/login/too-many?retryAfter=60');
    cy.location('pathname').should('eq', '/login/too-many');
    cy.contains('button', 'Войти снова').should('be.visible');
    cy.contains('button', 'Войти снова').should('be.disabled');
  });

  it('disables login fields while sign-in action is pending (R-4)', () => {
    cy.intercept('POST', '**/login', (req) => {
      req.reply((res) => {
        res.delay = 1200;
        res.send();
      });
    }).as('signInPost');
    cy.visitLogin();
    cy.get('#workspaceSlug').clear().type('yakimovs');
    cy.get('#password').clear().type('wrong-password-1', { log: false });
    cy.contains('button', 'Войти').click();
    cy.contains('button', 'Войти').should('be.disabled');
    cy.get('#workspaceSlug').should('be.disabled');
    cy.wait('@signInPost');
    cy.contains('button', 'Войти').should('not.be.disabled');
  });

  it('sends at most two sign-in action POSTs on double click (R-4, R-23)', () => {
    cy.intercept('POST', '**/login').as('signInPost');
    cy.visitLogin();
    cy.get('#workspaceSlug').clear().type('yakimovs');
    cy.get('#password').clear().type('wrong-password-1', { log: false });
    cy.contains('button', 'Войти').dblclick();
    cy.location('pathname').should('eq', '/login');
    cy.get('@signInPost.all', { timeout: 10_000 }).then((interceptions) => {
      expect(interceptions.length).to.be.at.most(2);
    });
  });

  it('keeps workspace slug after invalid credentials (R-18)', () => {
    cy.visitLogin();
    cy.get('#workspaceSlug').clear().type('yakimovs');
    cy.get('#password').clear().type('wrong-password-1', { log: false });
    cy.contains('button', 'Войти').click();
    cy.location('pathname').should('eq', '/login');
    cy.get('#workspaceSlug').should('have.value', 'yakimovs');
  });
});
