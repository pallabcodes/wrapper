import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
import { BackupService } from './backup.service';
import { RestoreService } from './restore.service';
import { DisasterRecoveryPlanService } from './disaster-recovery-plan.service';
import { BusinessContinuityService } from './business-continuity.service';
import { DisasterRecoveryMetrics } from '../interfaces/disaster-recovery.interface';

@Injectable()
export class DisasterRecoveryService {
  private readonly logger = new Logger(DisasterRecoveryService.name);

  constructor(
    // private readonly configService: ConfigService,
    private readonly backupService: BackupService,
    private readonly restoreService: RestoreService,
    private readonly drPlanService: DisasterRecoveryPlanService,
    private readonly bcService: BusinessContinuityService
  ) {}

  async getOverallStatus(): Promise<any> {
    const backupStats = await this.backupService.getBackupStatistics();
    const restoreStats = await this.restoreService.getRestoreStatistics();
    const drMetrics = await this.drPlanService.getDRMetrics();
    // const bcMetrics = await this.bcService.getBCMetrics();

    return {
      backup: backupStats,
      restore: restoreStats,
      disasterRecovery: drMetrics,
      businessContinuity: {}, // bcMetrics,
      overallHealth: this.calculateOverallHealth(backupStats, restoreStats, drMetrics, {}),
      lastUpdated: new Date()
    };
  }

  private calculateOverallHealth(backupStats: any, restoreStats: any, drMetrics: any, bcMetrics: any): {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 100;

    // Backup health scoring
    if (backupStats.successRate < 95) {
      score -= 20;
      issues.push('Backup success rate below 95%');
    }
    if (backupStats.failedJobs > 5) {
      score -= 15;
      issues.push('High number of failed backup jobs');
    }

    // Restore health scoring
    if (restoreStats.successRate < 90) {
      score -= 25;
      issues.push('Restore success rate below 90%');
    }
    if (restoreStats.failedJobs > 3) {
      score -= 20;
      issues.push('High number of failed restore jobs');
    }

    // DR plan health scoring
    if (drMetrics.criticalIssues > 0) {
      score -= 30;
      issues.push(`${drMetrics.criticalIssues} critical DR issues`);
    }
    if (drMetrics.testSuccessRate < 80) {
      score -= 15;
      issues.push('DR test success rate below 80%');
    }

    // Business continuity health scoring
    if (bcMetrics.resolutionRate < 90) {
      score -= 10;
      issues.push('Incident resolution rate below 90%');
    }
    if (bcMetrics.openIncidents > 5) {
      score -= 15;
      issues.push('High number of open incidents');
    }

    let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    if (score >= 90) status = 'excellent';
    else if (score >= 80) status = 'good';
    else if (score >= 70) status = 'fair';
    else if (score >= 50) status = 'poor';
    else status = 'critical';

    return { score, status, issues };
  }

  async getMetrics(): Promise<DisasterRecoveryMetrics> {
    const backupStats = await this.backupService.getBackupStatistics();
    const restoreStats = await this.restoreService.getRestoreStatistics();
    const drMetrics = await this.drPlanService.getDRMetrics();
    // const bcMetrics = await this.bcService.getBCMetrics();

    return {
      rto: {
        target: 30, // 30 minutes target
        actual: drMetrics.averageRTO || 30,
        trend: 'stable'
      },
      rpo: {
        target: 5, // 5 minutes target
        actual: drMetrics.averageRPO || 5,
        trend: 'stable'
      },
      availability: {
        current: 99.9,
        target: 99.95,
        uptime: 99.9,
        downtime: 0.1
      },
      backup: {
        successRate: backupStats.successRate,
        averageDuration: backupStats.averageDuration,
        totalSize: backupStats.totalSize,
        retentionCompliance: 100
      },
      restore: {
        successRate: restoreStats.successRate,
        averageDuration: restoreStats.averageDuration,
        dataIntegrity: 99.9
      },
      testing: {
        lastTest: drMetrics.lastTest,
        nextTest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        passRate: drMetrics.testSuccessRate,
        issuesCount: drMetrics.criticalIssues
      }
    };
  }

  async triggerDisasterRecovery(planId: string, incidentType: string): Promise<{
    success: boolean;
    message: string;
    estimatedRecoveryTime: number;
    steps: string[];
  }> {
    this.logger.log(`Triggering disaster recovery for plan: ${planId}, incident: ${incidentType}`);

    const plan = await this.drPlanService.getDRPlan(planId);
    if (!plan) {
      throw new Error(`DR Plan not found: ${planId}`);
    }

    const steps: string[] = [];
    let estimatedRecoveryTime = 0;

    try {
      // Execute DR procedures in order
      const sortedProcedures = plan.procedures.sort((a, b) => a.order - b.order);
      
      for (const procedure of sortedProcedures) {
        steps.push(`Executing ${procedure.name}...`);
        estimatedRecoveryTime += procedure.estimatedDuration;
        
        // Simulate procedure execution
        await this.delay(1000);
        
        // Simulate occasional failures
        if (Math.random() < 0.1) {
          throw new Error(`Procedure ${procedure.name} failed during execution`);
        }
        
        steps.push(`✓ ${procedure.name} completed`);
      }

      // Create incident record
      await this.bcService.createIncident({
        planId,
        type: incidentType,
        severity: 'critical',
        status: 'resolved',
        resolutionTime: estimatedRecoveryTime,
        steps
      });

      return {
        success: true,
        message: 'Disaster recovery procedures executed successfully',
        estimatedRecoveryTime,
        steps
      };
    } catch (error) {
      this.logger.error(`Disaster recovery failed: ${(error as Error).message}`);
      return {
        success: false,
        message: `Disaster recovery failed: ${(error as Error).message}`,
        estimatedRecoveryTime,
        steps
      };
    }
  }

  async testDisasterRecovery(planId: string, testType: 'tabletop' | 'simulation' | 'full_test'): Promise<any> {
    this.logger.log(`Testing disaster recovery for plan: ${planId}, type: ${testType}`);

    const test = await this.drPlanService.scheduleDRTest(planId, testType);
    const result = await this.drPlanService.executeDRTest(test.id);

    return {
      testId: test.id,
      status: result.status,
      duration: result.duration,
      results: result.results,
      issues: result.issues,
      recommendations: result.recommendations
    };
  }

  async getRecoveryRecommendations(): Promise<string[]> {
    const metrics = await this.getMetrics();
    const recommendations: string[] = [];

    // RTO recommendations
    if (metrics.rto.actual > metrics.rto.target) {
      recommendations.push('Consider implementing faster failover mechanisms to improve RTO');
    }

    // RPO recommendations
    if (metrics.rpo.actual > metrics.rpo.target) {
      recommendations.push('Implement more frequent backups to improve RPO');
    }

    // Availability recommendations
    if (metrics.availability.current < metrics.availability.target) {
      recommendations.push('Review infrastructure redundancy to improve availability');
    }

    // Backup recommendations
    if (metrics.backup.successRate < 95) {
      recommendations.push('Investigate and fix backup failures to improve success rate');
    }

    // Restore recommendations
    if (metrics.restore.successRate < 90) {
      recommendations.push('Review restore procedures and test more frequently');
    }

    // Testing recommendations
    if (metrics.testing.passRate < 80) {
      recommendations.push('Address failed DR tests and improve testing procedures');
    }

    if (metrics.testing.issuesCount > 0) {
      recommendations.push(`Resolve ${metrics.testing.issuesCount} critical DR issues`);
    }

    return recommendations;
  }

  async generateDisasterRecoveryReport(): Promise<any> {
    const status = await this.getOverallStatus();
    const metrics = await this.getMetrics();
    const recommendations = await this.getRecoveryRecommendations();

    return {
      reportId: `dr-report-${Date.now()}`,
      generatedAt: new Date(),
      executiveSummary: {
        overallHealth: status.overallHealth,
        keyMetrics: {
          rto: metrics.rto,
          rpo: metrics.rpo,
          availability: metrics.availability
        },
        criticalIssues: status.overallHealth.issues,
        recommendations: recommendations.slice(0, 5) // Top 5 recommendations
      },
      detailedMetrics: metrics,
      backupAnalysis: status.backup,
      restoreAnalysis: status.restore,
      disasterRecoveryAnalysis: status.disasterRecovery,
      businessContinuityAnalysis: status.businessContinuity,
      recommendations,
      nextSteps: [
        'Review and address critical issues',
        'Implement recommended improvements',
        'Schedule next DR test',
        'Update DR plans based on findings'
      ]
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
