import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ComplianceService } from '../services/compliance.service';
import { COMPLIANCE_METADATA_KEY, ComplianceOptions } from '../decorators/compliance.decorator';

@Injectable()
export class ComplianceGuard implements CanActivate {
  private readonly logger = new Logger(ComplianceGuard.name);

  constructor(
    private reflector: Reflector,
    private complianceService: ComplianceService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const complianceOptions = this.reflector.getAllAndOverride<ComplianceOptions>(
      COMPLIANCE_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!complianceOptions) {
      return true; // No compliance requirements
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;
    const method = request.method;
    const url = request.url;

    try {
      // Validate compliance based on requirements
      const isValid = await this.complianceService.validateCompliance(body, {
        type: this.extractDataType(url, body),
        action: this.mapHttpMethodToAction(method),
        userId: user?.id || 'anonymous'
      });

      if (!isValid) {
        this.logger.warn(`Compliance validation failed for ${method} ${url}`, {
          userId: user?.id,
          complianceOptions
        });
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Compliance validation error: ${error.message}`, error.stack);
      return false;
    }
  }

  private extractDataType(url: string, body: any): string {
    // Extract data type from URL or body
    if (url.includes('/health') || body?.type === 'health') {
      return 'health';
    }
    if (url.includes('/financial') || body?.type === 'financial') {
      return 'financial';
    }
    if (url.includes('/personal') || body?.type === 'personal') {
      return 'personal';
    }
    return 'general';
  }

  private mapHttpMethodToAction(method: string): string {
    const methodMap: Record<string, string> = {
      'GET': 'read',
      'POST': 'create',
      'PUT': 'update',
      'PATCH': 'update',
      'DELETE': 'delete'
    };
    return methodMap[method] || 'read';
  }
}
