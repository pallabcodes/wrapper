import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { TypedJwtAuthGuard } from '@ecommerce-enterprise/nest-enterprise-auth';
import { RbacGuard, RequireRoles, RequirePermissions } from '@ecommerce-enterprise/nest-enterprise-rbac';

@Controller()
export class HelloController {
  @Get('/public')
  getPublic() {
    return { ok: true, message: 'public' };
  }

  @UseGuards(TypedJwtAuthGuard as any, RbacGuard)
  @RequireRoles('admin')
  @RequirePermissions('read:reports')
  @Get('/secure')
  getSecure(@Req() req: Request) {
    const user = (req as any).user || (req as any).authContext?.user;
    return { ok: true, message: 'secure', user };
  }
}
