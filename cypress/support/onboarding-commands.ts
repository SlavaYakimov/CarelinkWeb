Cypress.Commands.add('fillPhoneOtp', (code: string) => {
  const digits = code.replace(/\D/g, '').slice(0, 4);
  expect(digits).to.have.length(4);

  for (let i = 0; i < 4; i += 1) {
    cy.get(`[aria-label="Цифра ${i + 1} из 4"]`)
      .click()
      .type(digits[i]!);
  }
});

Cypress.Commands.add('fillOtp', (code: string, firstInputId?: string) => {
  const digits = code.replace(/\D/g, '').slice(0, 6);
  expect(digits).to.have.length(6);

  if (firstInputId) {
    cy.get(`#${firstInputId}`).click().type(digits[0]!);
    for (let i = 1; i < 6; i += 1) {
      cy.get(`[aria-label="Цифра ${i + 1} из 6"]`).type(digits[i]!);
    }
    return;
  }

  for (let i = 0; i < 6; i += 1) {
    cy.get(`[aria-label="Цифра ${i + 1} из 6"]`)
      .click()
      .type(digits[i]!);
  }
});

Cypress.Commands.add('onboardingEnterEmail', (email: string) => {
  cy.visit('/onboarding/email');
  cy.contains('h1', 'Личная почта').should('be.visible');
  cy.get('#email').clear().type(email);
  cy.contains('button', 'Отправить код').click();
  cy.contains('Код отправлен на', { timeout: 30_000 }).should('be.visible');
});

Cypress.Commands.add('onboardingEnterEmailOtp', (code: string) => {
  cy.fillOtp(code, 'email-otp');
  cy.contains('button', 'Продолжить').click();
});

Cypress.Commands.add(
  'onboardingEnterPhone',
  (displayName: string, phoneDigits: string, smsCode: string) => {
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/phone');
    cy.get('#displayName').clear().type(displayName);
    cy.get('#phone').clear().type(phoneDigits);
    cy.contains('button', 'Отправить SMS-код').click();
    cy.contains('Код из SMS', { timeout: 30_000 }).should('be.visible');
    cy.fillOtp(smsCode);
    cy.contains('button', 'Подтвердить').click();
  },
);

Cypress.Commands.add('onboardingEnterDeviceSms', (phoneDigits: string, smsOrdinal?: number) => {
  cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/device');
  cy.get('body').then(($body) => {
    if ($body.text().includes('Получить SMS-код')) {
      cy.contains('button', 'Получить SMS-код').click();
    }
  });
  cy.contains('Введите код из SMS, чтобы доверить', { timeout: 30_000 }).should('be.visible');
  // Second SMS for the same phone (device verify). skipPriorMatches avoids the phone-step OTP;
  // excludeCode breaks compose when DEV_FIXED_OTP_SMS makes both codes identical.
  // smsOrdinal: wait for the N-th SMS to this number and take the newest (repeat onboarding).
  const otpQuery = smsOrdinal
    ? { channel: 'sms', to: phoneDigits, minRecipientMatches: smsOrdinal }
    : { channel: 'sms', to: phoneDigits, skipPriorMatches: 1, minRecipientMatches: 2 };
  cy.task<string>('fetchOnboardingOtp', otpQuery).then((deviceOtp) => {
    cy.fillOtp(deviceOtp);
    cy.contains('button', 'Продолжить').click();
  });
});

Cypress.Commands.add('onboardingEnterPassword', (password: string) => {
  cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/password');
  cy.get('#newPassword').clear().type(password);
  cy.get('#confirmPassword').clear().type(password);
  cy.contains('button', 'Сохранить пароль').click();
});

Cypress.Commands.add('setCarelinkFlowCookie', (fid: string, cookieName = 'cl_flow') => {
  cy.setCookie(cookieName, fid, { httpOnly: true, sameSite: 'lax' });
});

Cypress.Commands.add('clearCarelinkCookie', (logical: 'cl_flow' | 'cl_sid' | 'cl_did') => {
  cy.getCookies().then((cookies) => {
    const match = cookies.find((c) => c.name === logical || c.name.endsWith(logical));
    if (match) {
      cy.clearCookie(match.name);
    }
  });
});

Cypress.Commands.add('composeOnboardingCreateFamily', (ts = Date.now()) => {
  const email = `e2e+${ts}@example.com`;
  const workspaceSlug = `e2e${ts.toString(36).slice(-8)}`;
  const displayName = 'E2E Семья';
  const password = 'Testpass1';
  const phoneDigits = `900${String(ts).slice(-7)}`;
  const workspaceEmail = `${workspaceSlug}@workspaces.carelink.app`;

  cy.onboardingEnterEmail(email);

  cy.task<string>('fetchOnboardingOtp', { channel: 'email', to: email }).then((emailOtp) => {
    cy.onboardingEnterEmailOtp(emailOtp);

    cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/phone');
    cy.get('#displayName').clear().type(displayName);
    cy.get('#phone').clear().type(phoneDigits);
    cy.contains('button', 'Отправить SMS-код').click();
    cy.contains('Код из SMS', { timeout: 30_000 }).should('be.visible');

    cy.task<string>('fetchOnboardingOtp', { channel: 'sms', to: phoneDigits }).then((phoneOtp) => {
      cy.fillOtp(phoneOtp);
      cy.contains('button', 'Подтвердить').click();

      cy.onboardingEnterDeviceSms(phoneDigits);
      cy.onboardingEnterPassword(password);
      cy.onboardingFinalizeWorkspace(workspaceSlug, displayName);
      cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/done');
      cy.wrap({
        email,
        workspaceSlug,
        workspaceEmail,
        phoneDigits,
        password,
        displayName,
      });
    });
  });
});

Cypress.Commands.add(
  'composeSignInViaSms',
  (workspaceEmail: string, password: string, phoneDigits: string) => {
    const completeVerifySmsDeviceStep = () => {
      cy.location('pathname', { timeout: 45_000 }).should('eq', '/login/verify-sms');
      cy.get('body').then(($body) => {
        if ($body.find('#phone').length) {
          cy.get('#phone').clear().type(phoneDigits);
          cy.contains('button', 'Отправить код').click();
        }
      });
      cy.contains('Код из SMS', { timeout: 30_000 }).should('be.visible');
      cy.task<string>('fetchOnboardingOtp', {
        channel: 'sms',
        to: phoneDigits,
        skipPriorMatches: 0,
      }).then((deviceOtp) => {
        cy.fillOtp(deviceOtp);
        cy.contains('button', 'Подтвердить').click();
      });
      cy.location('pathname', { timeout: 45_000 }).should('eq', '/families');
      cy.getCookies().should((cookies) => {
        const hasSid = cookies.some((c) => c.name === 'cl_sid' || c.name.endsWith('cl_sid'));
        expect(hasSid).to.eq(true);
      });
    };

    cy.clearCarelinkCookie('cl_sid');
    cy.clearCarelinkCookie('cl_did');
    cy.visitLogin();
    cy.get('input[name="trustDevice"]').uncheck();
    cy.fillWorkspaceLogin(workspaceEmail, password);
    cy.location('pathname', { timeout: 45_000 }).should('match', /^\/login\/verify-(phone|sms)$/);

    cy.location('pathname').then((pathname) => {
      if (pathname === '/login/verify-phone') {
        cy.get('#phone').clear().type(phoneDigits);
        cy.contains('button', 'Отправить код').click();
        cy.get('[aria-label="Цифра 1 из 6"]', { timeout: 30_000 }).should('be.visible');
        cy.task<string>('fetchOnboardingOtp', {
          channel: 'sms',
          to: phoneDigits,
          skipPriorMatches: 0,
        }).then((phoneOtp) => {
          cy.fillOtp(phoneOtp);
          cy.contains('button', 'Продолжить').click();
          completeVerifySmsDeviceStep();
        });
        return;
      }
      completeVerifySmsDeviceStep();
    });
  },
);

Cypress.Commands.add(
  'onboardingFinalizeWorkspace',
  (workspaceSlug: string, displayName: string) => {
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/workspace');
    cy.get('#displayName').clear().type(displayName);
    cy.get('#workspaceSlug').clear().type(workspaceSlug);
    cy.get('#workspaceSlug').blur();
    cy.contains('Проверяем, свободен ли адрес', { timeout: 15_000 }).should('not.exist');
    cy.contains('button', 'Создать семью', { timeout: 15_000 }).should('not.be.disabled');
    cy.contains('button', 'Создать семью').click();
  },
);
