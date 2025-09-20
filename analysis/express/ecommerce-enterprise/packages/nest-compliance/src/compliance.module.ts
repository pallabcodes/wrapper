import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ComplianceService } from './services/compliance.service';
import { GDPRService } from './services/gdpr.service';
import { SOXService } from './services/sox.service';
import { HIPAAService } from './services/hipaa.service';
import { ComplianceGuard } from './guards/compliance.guard';
import { ComplianceInterceptor } from './interceptors/compliance.interceptor';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    ComplianceService,
    GDPRService,
    SOXService,
    HIPAAService,
    ComplianceGuard,
    ComplianceInterceptor
  ],
  exports: [
    ComplianceService,
    GDPRService,
    SOXService,
    HIPAAService,
    ComplianceGuard,
    ComplianceInterceptor
  ]
})
export class ComplianceModule {}
