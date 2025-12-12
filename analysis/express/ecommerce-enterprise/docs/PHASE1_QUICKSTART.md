# Phase 1 Quick Start Guide

This guide helps you get started with Phase 1: Type Safety Remediation.

## Prerequisites

- Node.js 18+ installed
- pnpm 8+ installed
- TypeScript 5.3+ installed
- Basic understanding of TypeScript types

## Step 1: Run Initial Audit

First, let's see what we're dealing with:

```bash
# Generate comprehensive audit report
npm run audit:types

# This creates: docs/type-safety-audit-report.md
```

The report will show:
- Total number of `any` types found
- Breakdown by category (guards, services, controllers, etc.)
- Breakdown by file
- Priority recommendations

## Step 2: Review the Report

Open `docs/type-safety-audit-report.md` and review:
1. Which categories have the most `any` types?
2. Which files are most affected?
3. What are the priority recommendations?

## Step 3: Start with High-Priority Files

Based on the audit, start fixing files in this order:

1. **Public APIs First** (guards, interceptors, controllers)
2. **Service Layer** (services, repositories)
3. **Internal Types** (utils, helpers)

## Step 4: Fix a File

### Example: Fixing a Guard

**Before:**
```typescript
// packages/nest-enterprise-auth/src/guards/typed-jwt.guard.ts
override handleRequest(err: any, user: any, info: any, context: ExecutionContext, _status?: any): any {
  if (err || !user) {
    throw err || info || new Error('Unauthorized');
  }
  return user;
}
```

**After:**
```typescript
// packages/nest-enterprise-auth/src/guards/typed-jwt.guard.ts
import type { AuthPrincipal } from '../types/auth.types';

override handleRequest(
  err: Error | null,
  user: AuthPrincipal | false,
  info: Error | undefined,
  context: ExecutionContext,
  _status?: number
): AuthPrincipal {
  if (err || !user) {
    throw err || info || new Error('Unauthorized');
  }
  return user;
}
```

### Steps to Fix:

1. **Identify the proper type** - What should `any` actually be?
2. **Check if type exists** - Look in `packages/types/src/` or create it
3. **Replace `any`** - Update function signatures and variable declarations
4. **Add imports** - Import necessary types
5. **Compile** - Run `npm run build` to check for errors
6. **Test** - Run tests to ensure nothing broke

## Step 5: Verify Your Changes

After fixing a file:

```bash
# Check TypeScript compilation
npm run build

# Run type safety check (should show fewer `any` types)
npm run audit:types:check

# Run tests for the package you modified
pnpm --filter @ecommerce-enterprise/nest-enterprise-auth test
```

## Step 6: Create a Pull Request

When you've fixed a category or set of files:

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "fix(types): replace any types in TypedJwtAuthGuard"
   ```

2. **Create a PR** with:
   - Description of what was fixed
   - Before/after examples
   - Link to type migration patterns doc

3. **Wait for review** - Ensure CI passes and get approval

## Common Patterns

See `docs/type-migration-patterns.md` for:
- Guard/interceptor patterns
- Service method patterns
- Controller handler patterns
- Database/ORM patterns
- External library patterns

## Tips

1. **Start small** - Fix one file at a time
2. **Use the patterns** - Reference `type-migration-patterns.md`
3. **Test as you go** - Don't wait until the end
4. **Ask for help** - If you're stuck on a pattern, ask the team
5. **Track progress** - Update the action plan checklist as you complete tasks

## Progress Tracking

Update `GOOGLE_SDE3_ACTION_PLAN.md` as you complete tasks:

```markdown
- [x] Fix TypedJwtAuthGuard types
- [x] Fix RefreshJwtAuthGuard types
- [ ] Fix RolesPermissionsGuard types
```

## Troubleshooting

### TypeScript Compilation Errors

If you get compilation errors:
1. Check the error message carefully
2. Ensure all imports are correct
3. Verify type definitions exist
4. Check if you need to create new types

### Tests Failing

If tests fail after type changes:
1. Check if the test is using the old `any` type
2. Update test mocks to use proper types
3. Ensure test data matches the new types

### Can't Find the Right Type

If you can't determine the right type:
1. Check the implementation to understand what it should be
2. Look at similar patterns in the codebase
3. Check external library documentation (e.g., Stripe, Express)
4. Create a new type if needed

## Next Steps

Once you've completed Phase 1:
1. All `any` types should be eliminated
2. Run final audit: `npm run audit:types:check` (should pass)
3. Move to Phase 2: Comprehensive Testing

## Resources

- [Type Migration Patterns](./type-migration-patterns.md)
- [Google SDE-3 Action Plan](../GOOGLE_SDE3_ACTION_PLAN.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/types.html)
