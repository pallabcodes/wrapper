# @ecommerce-enterprise/nest-enterprise-rbac

Lightweight, non-opinionated RBAC helper for NestJS. Composes with any auth solution (e.g. @nest-enterprise-auth).

- Decorators: `@RequireRoles`, `@RequirePermissions`, `@RequirePolicy`
- Guard: `RbacGuard` + `UseRbacGuard()` alias
- Policy model: AND/OR within requirements and anyOf/allOf across requirement blocks

## Install

Peer deps are standard Nest packages.

## Quick start

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { RbacModule } from '@ecommerce-enterprise/nest-enterprise-rbac';

@Module({
  imports: [RbacModule.forRoot()],
})
export class AppModule {}
```

```ts
// admin.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  RequireRoles,
  RequirePermissions,
  UseRbacGuard,
} from '@ecommerce-enterprise/nest-enterprise-rbac';

@Controller('admin')
@UseRbacGuard()
export class AdminController {
  @Get('reports')
  @RequireRoles(['admin'])
  @RequirePermissions(['report:read'])
  getReports() {
    return { ok: true };
  }
}
```

## Advanced policy

```ts
import { RequirePolicy } from '@ecommerce-enterprise/nest-enterprise-rbac';

// Any of these requirement blocks may pass
const policy = {
  anyOf: [
    { roles: ['admin'] },
    { roles: ['manager'], permissions: ['report:read'], mode: 'AND' },
    { permissions: ['report:read', 'region:eu'], mode: 'AND' },
  ],
};

@RequirePolicy(policy)
```

## Notes
- `RbacGuard` reads `req.user` (or `req.authContext.user` if present) with `{ roles?: string[]; permissions?: string[] }`.
- Decorators compose: stacking multiple decorators merges their policies.
- This package does not perform authentication or token validation; use with your preferred auth.

