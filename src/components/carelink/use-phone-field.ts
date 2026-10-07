'use client';

import * as React from 'react';

export type PhoneField = {
  display: string;
  e164: string;
  onChange: (display: string, e164: string | null) => void;
  submitValue: string;
};

export function usePhoneField(initialDisplay = ''): PhoneField {
  const [display, setDisplay] = React.useState(initialDisplay);
  const [e164, setE164] = React.useState('');

  const onChange = React.useCallback((nextDisplay: string, nextE164: string | null) => {
    setDisplay(nextDisplay);
    setE164(nextE164 ?? '');
  }, []);

  return { display, e164, onChange, submitValue: e164 || display };
}
