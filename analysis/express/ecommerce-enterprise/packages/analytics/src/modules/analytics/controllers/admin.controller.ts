import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { DecisionAuditService, PolicyService, RebacService, RequirePermissions } from '@ecommerce-enterprise/authx';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly audit: DecisionAuditService,
    private readonly policies: PolicyService,
    private readonly rebac: RebacService,
  ) {}

  @RequirePermissions('auth:inspect')
  @Get('decisions')
  getRecentDecisions() {
    return this.audit.recent(200);
  }

  @RequirePermissions('auth:manage')
  @Post('rebac')
  async addTuple(@Body() body: { subject: string; relation: string; object: string }) {
    await this.rebac.add(body);
    return { ok: true };
  }

  @RequirePermissions('auth:manage')
  @Delete('rebac')
  async removeTuple(@Body() body: { subject: string; relation: string; object: string }) {
    await this.rebac.remove(body);
    return { ok: true };
  }

  @RequirePermissions('auth:manage')
  @Post('roles')
  addRole(@Body() body: { role: string; permissions: string[] }) {
    this.policies.registerRole(body.role, body.permissions || []);
    return { ok: true };
  }
}


