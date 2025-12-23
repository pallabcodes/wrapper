import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantService {
  resolve(req: any): string {
    const hdr = (req.headers?.['x-tenant-id'] as string | undefined)?.trim();
    if (hdr) return hdr;
    const fromAuth = (req.user || req.auth)?.tenantId as string | undefined;
    if (fromAuth) return String(fromAuth);
    return 'default';
  }
}


