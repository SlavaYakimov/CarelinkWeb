/**
 * Full sign-in with SMS device verification (PLAN.md §6, screen 07).
 * Requires CarelinkAuth docker-compose overlay BE-21 and CYPRESS_E2E_COMPOSE=1.
 */
describe.skip('sign-in new device via SMS (requires compose BE-21)', () => {
  it('completes workspace login and reaches /families', () => {
    // 1. cy.visitLogin()
    // 2. cy.fillWorkspaceLogin(workspaceEmail, password)
    // 3. assert /login/verify-sms
    // 4. read OTP from compose notification logs (helpers/otp.ts — TODO)
    // 5. enter OTP, assert /families
  });
});
