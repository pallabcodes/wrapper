import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
// import { ComplianceService } from '../services/compliance.service';
import { Reflector } from '@nestjs/core';
import { COMPLIANCE_METADATA_KEY, ComplianceOptions } from '../decorators/compliance.decorator';

@Injectable()
export class ComplianceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ComplianceInterceptor.name);

  constructor(
    // private readonly complianceService: ComplianceService,
    private reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const complianceOptions = this.reflector.getAllAndOverride<ComplianceOptions>(
      COMPLIANCE_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!complianceOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    // const response = context.switchToHttp().getResponse();
    const user = request.user;
    const method = request.method;
    const url = request.url;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: async (data) => {
          const duration = Date.now() - startTime;
          await this.logComplianceEvent('success', {
            method,
            url,
            userId: user?.id,
            duration,
            data: this.sanitizeData(data),
            complianceOptions
          });
        },
        error: async (error) => {
          const duration = Date.now() - startTime;
          await this.logComplianceEvent('error', {
            method,
            url,
            userId: user?.id,
            duration,
            error: error.message,
            complianceOptions
          });
        }
      })
    );
  }

  private async logComplianceEvent(type: 'success' | 'error', event: any): Promise<void> {
    try {
      // Log audit trail for compliance
      if (event.complianceOptions.audit?.required) {
        // Note: In a real implementation, you would call a public method
        // For now, we'll just log the event
        this.logger.debug(`Compliance event: api_${type}`, {
          method: event.method,
          url: event.url,
          userId: event.userId,
          duration: event.duration
        });
      }

      this.logger.debug(`Compliance event logged: ${type}`, event);
    } catch (error) {
      this.logger.error(`Failed to log compliance event: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    // Remove sensitive information for logging
    const sensitiveFields = ['password', 'ssn', 'creditCard', 'bankAccount', 'medicalRecord'];
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      }
      
      return sanitized;
    }
    
    return data;
  }
}
