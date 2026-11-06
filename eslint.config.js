import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // `.claude` holds git worktrees when linting from the main checkout.
  globalIgnores(['dist', 'node_modules', '.claude']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    // Stubs keep their intended signature, so `_name` marks an unused argument.
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.config.{js,ts}', 'functions/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
]);
