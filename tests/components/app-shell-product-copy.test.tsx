// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from '@/components/carelink/AppShell';

const FORBIDDEN = [/шифрован/i, /сквозн/i, /HIPAA/i, /GDPR/i, /в сети/i, /TLS\s*1\.3/i];

describe('AppShell product copy', () => {
  it('has no security marketing in shell chrome', () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );
    const text = document.body.textContent ?? '';
    for (const pattern of FORBIDDEN) {
      expect(text).not.toMatch(pattern);
    }
    expect(screen.getByText('Главная')).toBeTruthy();
  });
});
