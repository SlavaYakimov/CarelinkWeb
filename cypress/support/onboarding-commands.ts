Cypress.Commands.add('fillPhoneOtp', (code: string) => {
  const digits = code.replace(/\D/g, '').slice(0, 4);
  expect(digits).to.have.length(4);

  for (let i = 0; i < 4; i += 1) {
    cy.get(`[aria-label="Цифра ${i + 1} из 4"]`)
      .click()
      .type(digits[i]!);
  }
});

Cypress.Commands.add('fillOtp', (code: string, inputId?: string) => {
  const digits = code.replace(/\D/g, '').slice(0, 6);
  expect(digits).to.have.length(6);

  const selector = inputId ? `#${inputId}` : '[data-otp-input]';
  cy.get(selector, { timeout: 30_000 }).first().click().clear().type(digits, { delay: 0 });
});

Cypress.Commands.add('acceptPersonalDataConsent', () => {
  cy.get('#personalDataConsent').then(($el) => {
    if ($el.attr('data-state') === 'checked') return;
    cy.wrap($el).click({ force: true });
    cy.get('#personalDataConsent').should('have.attr', 'data-state', 'checked');
  });
});

Cypress.Commands.add('onboardingEnterEmail', (email: string) => {
  cy.visit('/onboarding/email');
  cy.contains('h1', 'Личная почта').should('be.visible');
  cy.get('#email').clear().type(email).should('have.value', email);
  cy.acceptPersonalDataConsent();
  cy.clickSubmitWhenEnabled('Отправить код');
  cy.contains('Код отправлен на', { timeout: 30_000 }).should('be.visible');
});

Cypress.Commands.add('onboardingEnterEmailOtp', (code: string) => {
  cy.fillOtp(code, 'email-otp');
  cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/phone');
});

Cypress.Commands.add(
  'onboardingEnterPhone',
  (displayName: string, phoneDigits: string, smsCode: string) => {
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/phone');
    cy.get('#displayName').clear().type(displayName);
    cy.get('#phone').clear().type(phoneDigits);
    cy.clickSubmitWhenEnabled('Отправить SMS-код');
    cy.contains('Код из SMS', { timeout: 30_000 }).should('be.visible');
    cy.fillOtp(smsCode, 'phone-otp');
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/device');
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
    cy.fillOtp(deviceOtp, 'device-otp');
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/password');
  });
});

Cypress.Commands.add('onboardingEnterPassword', (password: string) => {
  cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/password');
  cy.get('#newPassword').clear().type(password);
  cy.get('#confirmPassword').clear().type(password);
  cy.clickSubmitWhenEnabled('Сохранить пароль');
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
    cy.clickSubmitWhenEnabled('Отправить SMS-код');
    cy.contains('Код из SMS', { timeout: 30_000 }).should('be.visible');

    cy.task<string>('fetchOnboardingOtp', { channel: 'sms', to: phoneDigits }).then((phoneOtp) => {
      cy.fillOtp(phoneOtp, 'phone-otp');
      cy.location('pathname', { timeout: 30_000 }).should('eq', '/onboarding/device');

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
          cy.clickSubmitWhenEnabled('Отправить код');
        }
      });
      cy.contains('Код из SMS', { timeout: 30_000 }).should('be.visible');
      cy.task<string>('fetchOnboardingOtp', {
        channel: 'sms',
        to: phoneDigits,
        skipPriorMatches: 0,
      }).then((deviceOtp) => {
        cy.fillOtp(deviceOtp, 'otp');
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
        cy.clickSubmitWhenEnabled('Отправить код');
        cy.get('#verify-phone-otp', { timeout: 30_000 }).should('exist');
        cy.get('#verify-phone-otp')
          .closest('[role="group"]')
          .find('.flex.gap-2')
          .should('be.visible');
        cy.task<string>('fetchOnboardingOtp', {
          channel: 'sms',
          to: phoneDigits,
          skipPriorMatches: 0,
        }).then((phoneOtp) => {
          cy.fillOtp(phoneOtp, 'verify-phone-otp');
          cy.location('pathname', { timeout: 45_000 }).should('eq', '/login/verify-sms');
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
    cy.get('#workspaceSlug').focus().trigger('blur');
    cy.contains('Проверяем, свободен ли адрес', { timeout: 15_000 }).should('not.exist');
    cy.contains('button', 'Создать семью', { timeout: 15_000 }).should('not.be.disabled');
    cy.clickSubmitWhenEnabled('Создать семью');
  },
);
