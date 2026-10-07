import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import security from 'eslint-plugin-security';

const eslintConfig = [
  ...coreWebVitals,
  ...nextTypescript,
  {
    plugins: { security },
    rules: {
      ...security.configs.recommended.rules,
      'security/detect-object-injection': 'off',
      // eslint-config-next 16 / react-hooks v7 — stricter than pre-15 baseline; revisit in UI pass
      'react-hooks/error-boundaries': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'next-env.d.ts', 'src/server/gateway/types.gen.ts'],
  },
];

export default eslintConfig;
