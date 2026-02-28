// @ts-check
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Ignore build artefacts and generated dirs
  { ignores: ['**/dist/**', '**/node_modules/**', '**/build/**', '**/*.js.map'] },

  // TypeScript-aware rules (recommended set)
  ...tseslint.configs.recommended,

  // Project-wide overrides: relax a few rules that fire on existing code
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
);
