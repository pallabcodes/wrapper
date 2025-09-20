import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSIONS = 'authx:require_permissions';
export function RequirePermissions(...permissions: string[]) {
  return SetMetadata(REQUIRE_PERMISSIONS, permissions);
}


