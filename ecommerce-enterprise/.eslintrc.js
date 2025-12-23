/**
 * ESLint Configuration - Enterprise Ecommerce
 * 
 * Strict linting rules for enterprise-grade code quality with functional programming patterns,
 * 200-line file limit, and Silicon Valley standards.
 */

module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // ===== FILE SIZE AND COMPLEXITY =====
    'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
    'max-params': ['error', { max: 4 }],
    'max-depth': ['error', { max: 4 }],
    'complexity': ['error', { max: 10 }],
    'max-nested-callbacks': ['error', { max: 3 }],

    // ===== FUNCTIONAL PROGRAMMING PATTERNS =====
    'prefer-const': 'error',
    'no-var': 'error',
    'no-loop-func': 'error',
    'prefer-arrow-callback': 'error',

    // ===== TYPE SAFETY =====
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',

    // ===== CODE QUALITY =====
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': 'error',

    // ===== NAMING CONVENTIONS =====
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'default',
        format: ['camelCase'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'memberLike',
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'require',
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },
    ],

    // ===== IMPORTS AND MODULES =====
    'no-duplicate-imports': 'error',
    'sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true }],

    // ===== DOCUMENTATION =====
    'valid-jsdoc': 'warn',

    // ===== SECURITY =====
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // ===== PERFORMANCE =====
    'no-await-in-loop': 'error',
    'prefer-promise-reject-errors': 'error',

    // ===== MAINTAINABILITY =====
    'no-magic-numbers': [
      'error',
      {
        ignore: [-1, 0, 1, 2, 100, 1000, 200, 500, 404, 401, 403, 500],
        ignoreArrayIndexes: true,
        detectObjects: false,
      },
    ],
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-unused-expressions': 'error',
    'no-unused-vars': 'off', // Handled by TypeScript
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],

    // ===== ERROR HANDLING =====
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',

    // ===== DISABLED RULES =====
    '@typescript-eslint/no-non-null-assertion': 'off', // Sometimes necessary
    '@typescript-eslint/ban-ts-comment': 'off', // Sometimes necessary for external libraries
    'functional/no-mixed-types': 'off', // Allow union types
  },
  overrides: [
    {
      // Test files can be longer and have different rules
      files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
      rules: {
        'max-lines': 'off',
        'max-lines-per-function': 'off',
        'functional/no-expression-statements': 'off',
        'no-console': 'off',
      },
    },
    {
      // Configuration files can be longer
      files: ['**/*.config.*', '**/turbo.json', '**/package.json'],
      rules: {
        'max-lines': 'off',
        'functional/no-expression-statements': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    'coverage/',
    '*.d.ts',
    '*.js',
    '*.mjs',
  ],
}
