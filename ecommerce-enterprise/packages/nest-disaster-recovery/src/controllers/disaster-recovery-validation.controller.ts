import { Controller, Post, Body, Query, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { DisasterRecoveryValidationService } from '../validation/disaster-recovery-validation.service';

@ApiTags('Disaster Recovery Validation')
@Controller('disaster-recovery/validate')
export class DisasterRecoveryValidationController {
  private readonly logger = new Logger(DisasterRecoveryValidationController.name);

  constructor(private readonly disasterRecoveryValidationService: DisasterRecoveryValidationService) {}

  @Post('backup')
  @ApiOperation({ summary: 'Validate disaster recovery backup job data' })
  @ApiResponse({ status: 200, description: 'Backup job validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Disaster recovery backup job data to validate' })
  async validateBackupJob(
    @Body() backupData: unknown,
    @Query('locale') locale?: string
  ) {
    this.logger.log(`Received backup job validation request for locale: ${locale}`);
    const result = await this.disasterRecoveryValidationService.validateBackupJob(backupData, {
      locale: locale || 'en',
      audit: true,
      cache: true,
    });
    if (!result.success) {
      this.logger.warn(`Backup job validation failed: ${JSON.stringify(result.errors)}`);
      return { success: false, errors: result.errors };
    }
    this.logger.log('Backup job validation successful');
    return { success: true, data: result.data };
  }

  @Post('restore')
  @ApiOperation({ summary: 'Validate disaster recovery restore job data' })
  @ApiResponse({ status: 200, description: 'Restore job validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Disaster recovery restore job data to validate' })
  async validateRestoreJob(
    @Body() restoreData: unknown,
    @Query('locale') locale?: string
  ) {
    this.logger.log(`Received restore job validation request for locale: ${locale}`);
    const result = await this.disasterRecoveryValidationService.validateRestoreJob(restoreData, {
      locale: locale || 'en',
      audit: true,
      cache: true,
    });
    if (!result.success) {
      this.logger.warn(`Restore job validation failed: ${JSON.stringify(result.errors)}`);
      return { success: false, errors: result.errors };
    }
    this.logger.log('Restore job validation successful');
    return { success: true, data: result.data };
  }

  @Post('plan')
  @ApiOperation({ summary: 'Validate disaster recovery plan data' })
  @ApiResponse({ status: 200, description: 'Disaster recovery plan validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Disaster recovery plan data to validate' })
  async validateDisasterRecoveryPlan(
    @Body() planData: unknown,
    @Query('locale') locale?: string
  ) {
    this.logger.log(`Received disaster recovery plan validation request for locale: ${locale}`);
    const result = await this.disasterRecoveryValidationService.validateDisasterRecoveryPlan(planData, {
      locale: locale || 'en',
      audit: true,
      cache: true,
    });
    if (!result.success) {
      this.logger.warn(`Disaster recovery plan validation failed: ${JSON.stringify(result.errors)}`);
      return { success: false, errors: result.errors };
    }
    this.logger.log('Disaster recovery plan validation successful');
    return { success: true, data: result.data };
  }

  @Post('event')
  @ApiOperation({ summary: 'Validate business continuity event data' })
  @ApiResponse({ status: 200, description: 'Business continuity event validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Business continuity event data to validate' })
  async validateBusinessContinuityEvent(
    @Body() eventData: unknown,
    @Query('locale') locale?: string
  ) {
    this.logger.log(`Received business continuity event validation request for locale: ${locale}`);
    const result = await this.disasterRecoveryValidationService.validateBusinessContinuityEvent(eventData, {
      locale: locale || 'en',
      audit: true,
      cache: true,
    });
    if (!result.success) {
      this.logger.warn(`Business continuity event validation failed: ${JSON.stringify(result.errors)}`);
      return { success: false, errors: result.errors };
    }
    this.logger.log('Business continuity event validation successful');
    return { success: true, data: result.data };
  }

  @Post('audit')
  @ApiOperation({ summary: 'Validate disaster recovery audit data' })
  @ApiResponse({ status: 200, description: 'Disaster recovery audit validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Disaster recovery audit data to validate' })
  async validateDisasterRecoveryAudit(
    @Body() auditData: unknown,
    @Query('locale') locale?: string
  ) {
    this.logger.log(`Received disaster recovery audit validation request for locale: ${locale}`);
    const result = await this.disasterRecoveryValidationService.validateDisasterRecoveryAudit(auditData, {
      locale: locale || 'en',
      audit: true,
      cache: true,
    });
    if (!result.success) {
      this.logger.warn(`Disaster recovery audit validation failed: ${JSON.stringify(result.errors)}`);
      return { success: false, errors: result.errors };
    }
    this.logger.log('Disaster recovery audit validation successful');
    return { success: true, data: result.data };
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch validate multiple disaster recovery entities' })
  @ApiResponse({ status: 200, description: 'Batch validation successful' })
  @ApiResponse({ status: 400, description: 'Batch validation failed' })
  @ApiBody({ description: 'Array of disaster recovery entities to validate' })
  async batchValidate(
    @Body() entities: { type: 'backup' | 'restore' | 'plan' | 'event' | 'audit'; data: unknown }[],
  ) {
    this.logger.log(`Received batch validation request for ${entities.length} entities`);
    const result = await this.disasterRecoveryValidationService.batchValidateDisasterRecoveryEntities(entities);
    if (result.failed > 0) {
      this.logger.warn(`Batch validation failed for ${result.failed} entities.`);
      return { success: false, ...result };
    }
    this.logger.log('Batch validation successful');
    return { success: true, ...result };
  }

  @Post('ab-test')
  @ApiOperation({ summary: 'Validate disaster recovery backup job data with A/B testing' })
  @ApiResponse({ status: 200, description: 'A/B test validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Disaster recovery backup job data to validate' })
  async validateABTest(
    @Body() backupData: unknown,
    @Query('variant') variant: string,
  ) {
    this.logger.log(`Received A/B test validation request for variant: ${variant}`);
    const result = await this.disasterRecoveryValidationService.validateWithABTesting(backupData, 'backup', variant);
    if (!result.success) {
      this.logger.warn(`A/B test validation failed: ${JSON.stringify(result.errors)}`);
      return { success: false, errors: result.errors };
    }
    this.logger.log('A/B test validation successful');
    return { success: true, data: result.data };
  }
}
