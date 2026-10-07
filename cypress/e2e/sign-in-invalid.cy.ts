describe('sign-in invalid credentials flow', () => {
  it('submits workspace login and shows an error without leaving the app shell', () => {
    cy.visitLogin();
    cy.fillWorkspaceLogin('test@workspaces.carelink.app', 'wrong-password-1');

    cy.location('pathname').should('eq', '/login');
    cy.get('[role="alert"]').should('be.visible');
    cy.get('body').then(($body) => {
      const text = $body.text();
      expect(
        text.includes('Не удалось войти') ||
          text.includes('Сервис вернул неожиданный ответ') ||
          text.includes('Неверный логин или пароль'),
      ).to.eq(true);
    });
  });
});
