import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './services/backup.service';
import { RestoreService } from './services/restore.service';
import { DisasterRecoveryPlanService } from './services/disaster-recovery-plan.service';
import { BusinessContinuityService } from './services/business-continuity.service';
import { DisasterRecoveryService } from './services/disaster-recovery.service';
import { DisasterRecoveryValidationModule } from './modules/disaster-recovery-validation.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    DisasterRecoveryValidationModule
  ],
  providers: [
    BackupService,
    RestoreService,
    DisasterRecoveryPlanService,
    BusinessContinuityService,
    DisasterRecoveryService
  ],
  exports: [
    BackupService,
    RestoreService,
    DisasterRecoveryPlanService,
    BusinessContinuityService,
    DisasterRecoveryService
  ]
})
export class DisasterRecoveryModule {}
