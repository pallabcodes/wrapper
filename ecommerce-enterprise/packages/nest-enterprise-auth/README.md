# @ecommerce-enterprise/nest-enterprise-auth

Typed, non‑breaking DX layer over Nest’s Passport + JWT stack. Keeps native behavior, reduces wiring, and improves type safety.

- Guards: `TypedJwtAuthGuard<TUser>`, `RefreshJwtAuthGuard`, `UseRefreshGuard()`
- Helpers: `signAccessToken`, `signRefreshToken`, `verifyRefreshToken`, `rotateTokens`, `setAuthCookies`
- Extractors: `getBearerFromHeader`, `getAccessTokenFromCookie`, `getRefreshTokenFromCookie`, `eitherFrom(...)`
- Module: `EnterpriseAuthModule.forRoot({ jwt, defaultStrategy? })`, `forFeature([...providers])`
- Decorators: `@CurrentUser(key?)`, `@AuthCtx()`

## Quick start

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { EnterpriseAuthModule } from '@ecommerce-enterprise/nest-enterprise-auth';

@Module({
  imports: [
    EnterpriseAuthModule.forRoot({
      jwt: { secret: process.env.JWT_SECRET!, signOptions: { expiresIn: '15m' } },
      defaultStrategy: 'jwt',
    }),
  ],
})
export class AppModule {}
```

```ts
// me.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { TypedJwtAuthGuard, CurrentUser, AuthCtx } from '@ecommerce-enterprise/nest-enterprise-auth';

type AppUser = { id: string; email?: string; roles?: string[]; permissions?: string[] };

@Controller('me')
@UseGuards(TypedJwtAuthGuard<AppUser>)
export class MeController {
  @Get()
  getMe(@CurrentUser() user: AppUser, @AuthCtx() ctx?: { requestId?: string }) {
    return { user, requestId: ctx?.requestId };
  }
}
```

## Refresh tokens (cookies or headers)

```ts
// auth.controller.ts
import { Controller, Post, Res, Req } from '@nestjs/common';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  rotateTokens,
  setAuthCookies,
  UseRefreshGuard,
  RefreshTokenStrategyFactory,
  getRefreshTokenFromCookie,
} from '@ecommerce-enterprise/nest-enterprise-auth';

@Post('login')
async login(@Res() res) {
  const user = { sub: 'user-123', email: 'u@example.com', jti: 'init' };
  const access = signAccessToken(user, { secret: process.env.ACCESS_SECRET!, expiresIn: '15m' });
  const refresh = signRefreshToken(user, { secret: process.env.REFRESH_SECRET!, expiresIn: '7d' });
  setAuthCookies(res, { access, refresh }, { sameSite: 'lax', secure: true });
  return res.send({ ok: true });
}

@Post('refresh')
@UseRefreshGuard()
async refresh(@Req() req, @Res() res) {
  const token = getRefreshTokenFromCookie(req)!;
  const parsed = verifyRefreshToken<{ sub: string; jti?: string }>(token, process.env.REFRESH_SECRET!);
  const rotated = await rotateTokens(
    { sub: parsed.sub, jti: parsed.jti },
    async old => generateAndPersistNewJti(old),
    {
      access: { secret: process.env.ACCESS_SECRET!, expiresIn: '15m' },
      refresh: { secret: process.env.REFRESH_SECRET!, expiresIn: '7d' },
    },
  );
  setAuthCookies(res, { access: rotated.access, refresh: rotated.refresh }, { sameSite: 'lax', secure: true });
  return res.send({ ok: true });
}
```

## Notes
- No behavior changes to strategies or token verification; these are thin helpers over `@nestjs/jwt`, `@nestjs/passport`, and `jsonwebtoken`.
- `TypedJwtAuthGuard` returns the user set by your Passport strategy; generic type is for controller DX.
- Works well with `@ecommerce-enterprise/nest-enterprise-rbac` for roles/permissions.

