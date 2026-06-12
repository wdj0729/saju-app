import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
  ]),
  {
    rules: {
      // Disabled: this rule fires on the valid pattern of reading client-only
      // storage (localStorage) inside a mount-only useEffect, which is the
      // correct way to hydrate state from browser APIs in an SSR app.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);

export default eslintConfig;
