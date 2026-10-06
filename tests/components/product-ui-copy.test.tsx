// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginForm } from '@/components/carelink/LoginForm';
import { PublicAuthLayout } from '@/components/carelink/PublicAuthLayout';

const FORBIDDEN_COPY = [
  /код приглашения/i,
  /шифрован/i,
  /сквозн/i,
  /HIPAA/i,
  /GDPR/i,
  /TLS\s*1\.3/i,
  /End-to-End/i,
  /медицинск/i,
];

function assertNoForbiddenCopy(container: HTMLElement) {
  const text = container.textContent ?? '';
  for (const pattern of FORBIDDEN_COPY) {
    expect(text).not.toMatch(pattern);
  }
}

describe('product UI copy', () => {
  it('LoginForm has no invite-code entry', () => {
    render(<LoginForm nextPath="/families" />);
    expect(screen.queryByRole('button', { name: /код приглашения/i })).toBeNull();
    expect(screen.queryByText(/^или$/i)).toBeNull();
    assertNoForbiddenCopy(document.body);
  });

  it('PublicAuthLayout has no security marketing footer', () => {
    const { container } = render(
      <PublicAuthLayout gatewayBadge={false}>
        <div>form</div>
      </PublicAuthLayout>,
    );
    assertNoForbiddenCopy(container);
    expect(screen.queryByText(/шифрован/i)).toBeNull();
  });
});
