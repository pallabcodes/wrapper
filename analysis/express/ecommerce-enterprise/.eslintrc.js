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
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json', './packages/*/tsconfig.json', './apps/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
    'functional',
    'prefer-arrow',
    'no-loops',
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
    'functional/no-let': 'error',
    'functional/no-loop-statements': 'error',
    'functional/no-this': 'error',
    'functional/no-class': 'error',
    'functional/prefer-readonly-type': 'error',
    'functional/no-return-void': 'error',
    'functional/functional-parameters': 'error',
    'functional/no-expression-statements': 'off', // Allow console.log in development
    'functional/no-conditional-statements': 'off', // Allow if/else for business logic
    'functional/no-try-statements': 'off', // Allow try/catch for error handling

    // ===== COMPOSITION OVER INHERITANCE =====
    'prefer-arrow/prefer-arrow-functions': [
      'error',
      {
        disallowPrototype: true,
        singleReturnOnly: false,
        classPropertiesAllowed: false,
      },
    ],
    'no-loops/no-loops': 'error',

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
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-duplicates': 'error',
    'import/no-unused-modules': 'error',

    // ===== DOCUMENTATION =====
    'jsdoc/require-jsdoc': [
      'error',
      {
        publicOnly: true,
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
        },
      },
    ],
    'jsdoc/require-param-description': 'error',
    'jsdoc/require-returns-description': 'error',

    // ===== SECURITY =====
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',

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
