// ESLint for apps/ and packages/ (docs/items/guard-rails.md, item 2): the
// recommended rules, plus React's two hooks rules, named one by one so a newer
// plugin preset cannot add rules unannounced.
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.node,
    },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      // Count a component used as <Name /> as a use of Name.
      'react/jsx-uses-vars': 'error',
      // `const { a, ...rest } = x` is how a field is left out of a copy.
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // The one finding in a Tier A or B file stays a warning: a Tier C and D
  // session does not fix it (guard-rails F-Q4). It is a roadmap line for an
  // Opus session ("A control-character test warns in the linter"); a new
  // finding anywhere else, in these files too, is an error.
  {
    files: ['apps/recipe/src/persistence.js'],
    rules: { 'no-control-regex': 'warn' },
  },
  // The app's screens run in the browser.
  {
    files: ['apps/recipe/src/**/*.{js,jsx}'],
    languageOptions: { globals: globals.browser },
  },
];
