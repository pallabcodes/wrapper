import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ReconciliationService } from '../../../application/services/reconciliation.service';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';

/**
 * Reconciliation Controller
 * API endpoints for reconciliation management
 */
@Controller('reconciliation')
@UseGuards(JwtAuthGuard)
export class ReconciliationController {
    constructor(private readonly reconciliationService: ReconciliationService) { }

    /**
     * Trigger manual reconciliation
     * POST /reconciliation/trigger?provider=stripe&date=2026-01-07
     */
    @Post('trigger')
    async triggerReconciliation(
        @Query('provider') provider: string = 'stripe',
        @Query('date') dateStr?: string,
    ) {
        const date = dateStr ? new Date(dateStr) : new Date();
        date.setDate(date.getDate() - 1); // Default to yesterday

        const result = await this.reconciliationService.triggerReconciliation(provider, date);

        return {
            success: true,
            recordId: result.id,
            status: result.status,
            message: `Reconciliation ${result.status.toLowerCase()} for ${provider} on ${date.toISOString().split('T')[0]}`,
        };
    }

    /**
     * Get reconciliation report
     * GET /reconciliation/report?startDate=2026-01-01&endDate=2026-01-07&provider=stripe
     */
    @Get('report')
    async getReport(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
        @Query('provider') provider?: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const report = await this.reconciliationService.getReconciliationReport(
            startDate,
            endDate,
            provider,
        );

        return {
            success: true,
            ...report,
        };
    }

    /**
     * Get reconciliation status
     * GET /reconciliation/status
     */
    @Get('status')
    async getStatus() {
        // Get latest reconciliation for each provider
        const providers = ['stripe', 'razorpay'];
        const statuses = await Promise.all(
            providers.map(async (provider) => {
                const report = await this.reconciliationService.getReconciliationReport(
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                    new Date(),
                    provider,
                );
                return {
                    provider,
                    lastReconciliation: report.records[0] || null,
                    last7Days: report.summary,
                };
            }),
        );

        return {
            success: true,
            statuses,
        };
    }
}
