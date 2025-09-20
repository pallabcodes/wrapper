// Main module
export { ComplianceModule } from './compliance.module';

// Services
export { ComplianceService } from './services/compliance.service';
export { GDPRService } from './services/gdpr.service';
export { SOXService } from './services/sox.service';
export { HIPAAService } from './services/hipaa.service';

// Guards and Interceptors
export { ComplianceGuard } from './guards/compliance.guard';
export { ComplianceInterceptor } from './interceptors/compliance.interceptor';

// Decorators
export { 
  Compliance, 
  GDPRRequired, 
  SOXRequired, 
  HIPAARequired, 
  AuditRequired,
  ComplianceOptions 
} from './decorators/compliance.decorator';

// Interfaces
export * from './interfaces/compliance.interface';
