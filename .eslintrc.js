/**
 * Root ESLint config shared across JS/TS workspaces.
 * Enforces single responsibility, barrel exports, no circular deps.
 */
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.base.json'],
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'import/no-cycle': ['error', { maxDepth: Infinity }],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@admidnight/shared/**/*', '!@admidnight/shared'],
            message: 'Do not import from shared subdirectories. Use @admidnight/shared barrel export.'
          },
          {
            group: ['@admidnight/zk-circuits/**/*', '!@admidnight/zk-circuits'],
            message: 'Do not import from zk-circuits subdirectories. Use @admidnight/zk-circuits barrel export.'
          }
        ]
      }
    ]
  }
};
