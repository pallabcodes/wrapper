/**
 * ESLint Configuration - Enterprise Grade
 * 
 * Enforces Google/Atlassian/PayPal/Stripe standards
 * - Max file length: 200 lines
 * - Complexity limits
 * - Security rules
 * - Performance optimizations
 */

import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import security from 'eslint-plugin-security'
import sonarjs from 'eslint-plugin-sonarjs'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'security': security,
      'sonarjs': sonarjs
    },
    rules: {
      // File size constraints (Silicon Valley standard)
      'max-lines': ['error', { 
        max: 200, 
        skipBlankLines: true, 
        skipComments: true 
      }],
      'max-lines-per-function': ['error', { 
        max: 50, 
        skipBlankLines: true, 
        skipComments: true 
      }],
      
      // Complexity constraints (Google standard)
      'complexity': ['error', { max: 10 }],
      'max-depth': ['error', { max: 4 }],
      'max-params': ['error', { max: 3 }],
      'max-statements': ['error', { max: 20 }],
      
      // TypeScript specific (Stripe/PayPal standard)
      '@typescript-eslint/no-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      
      // Security rules (Enterprise standard)
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      
      // Code quality (SonarJS - Atlassian standard)
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-unused-collection': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/prefer-object-literal': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
      
      // Performance rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Modern JavaScript patterns
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'prefer-destructuring': 'error'
    }
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      // Relax some rules for tests
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
]
