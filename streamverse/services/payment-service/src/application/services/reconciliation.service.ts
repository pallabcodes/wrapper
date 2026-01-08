import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReconciliationRepository } from '../infrastructure/persistence/reconciliation.repository';
import {
    ReconciliationStatus,
    ReconciliationRecordEntity,
    DiscrepancyEntity,
    DiscrepancyType,
} from '../infrastructure/persistence/entities/reconciliation.entity';
import { PaymentEntity } from '../infrastructure/persistence/entities/payment.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/**
 * Reconciliation Service
 * 
 * Production-grade payment reconciliation with PSP records.
 * Runs daily to verify all payments match between local DB and PSP.
 */
@Injectable()
export class ReconciliationService {
    private readonly logger = new Logger(ReconciliationService.name);
    private readonly stripe: Stripe;

    constructor(
        private readonly reconciliationRepository: ReconciliationRepository,
        @InjectRepository(PaymentEntity)
        private readonly paymentRepository: Repository<PaymentEntity>,
        private readonly configService: ConfigService,
    ) {
        this.stripe = new Stripe(
            this.configService.get('STRIPE_SECRET_KEY') || 'sk_test_placeholder',
            { apiVersion: '2023-10-16' },
        );
    }

    /**
     * Scheduled daily reconciliation - runs at 2 AM
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async runDailyReconciliation(): Promise<void> {
        this.logger.log('Starting daily reconciliation...');

        // Reconcile yesterday's transactions
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        try {
            await this.reconcilePayments('stripe', yesterday);
            // await this.reconcilePayments('razorpay', yesterday); // Enable when needed
            this.logger.log('Daily reconciliation completed');
        } catch (error) {
            this.logger.error('Daily reconciliation failed', error);
        }
    }

    /**
     * Reconcile payments for a specific provider and date
     */
    async reconcilePayments(
        provider: string,
        date: Date,
    ): Promise<ReconciliationRecordEntity> {
        // Create reconciliation record
        const record = await this.reconciliationRepository.createRecord({
            provider,
            reconciliationDate: date,
            status: ReconciliationStatus.IN_PROGRESS,
            startedAt: new Date(),
        });

        try {
            // Get local payments for the date
            const localPayments = await this.getLocalPayments(provider, date);

            // Get PSP payments for the date
            const pspPayments = await this.getPSPPayments(provider, date);

            // Compare and find discrepancies
            const discrepancies = await this.comparePayments(
                record.id,
                provider,
                localPayments,
                pspPayments,
            );

            // Calculate totals
            const totalAmount = localPayments.reduce(
                (sum, p) => sum + (p.amount || 0),
                0,
            );
            const discrepancyAmount = discrepancies.reduce(
                (sum, d) => sum + Math.abs(d.amountDifference || 0),
                0,
            );

            // Update record with results
            const status = discrepancies.length === 0
                ? ReconciliationStatus.COMPLETED
                : ReconciliationStatus.PARTIAL;

            return this.reconciliationRepository.updateRecord(record.id, {
                status,
                totalTransactions: localPayments.length,
                matchedTransactions: localPayments.length - discrepancies.length,
                discrepancyCount: discrepancies.length,
                totalAmountReconciled: totalAmount,
                discrepancyAmount,
                completedAt: new Date(),
            });

        } catch (error) {
            // Mark as failed
            await this.reconciliationRepository.updateRecord(record.id, {
                status: ReconciliationStatus.FAILED,
                errorMessage: error.message,
                completedAt: new Date(),
            });
            throw error;
        }
    }

    /**
     * Get local payments from database
     */
    private async getLocalPayments(
        provider: string,
        date: Date,
    ): Promise<PaymentEntity[]> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return this.paymentRepository
            .createQueryBuilder('p')
            .where('p.provider = :provider', { provider })
            .andWhere('p.createdAt BETWEEN :start AND :end', {
                start: startOfDay,
                end: endOfDay,
            })
            .andWhere('p.status IN (:...statuses)', {
                statuses: ['completed', 'refunded', 'partially_refunded'],
            })
            .getMany();
    }

    /**
     * Get payments from PSP (Stripe)
     */
    private async getPSPPayments(
        provider: string,
        date: Date,
    ): Promise<Map<string, Stripe.PaymentIntent>> {
        const payments = new Map<string, Stripe.PaymentIntent>();

        if (provider !== 'stripe') {
            // TODO: Implement Razorpay reconciliation
            return payments;
        }

        const startOfDay = Math.floor(date.getTime() / 1000);
        const endOfDay = startOfDay + 86400; // 24 hours

        let hasMore = true;
        let startingAfter: string | undefined;

        while (hasMore) {
            const response = await this.stripe.paymentIntents.list({
                created: {
                    gte: startOfDay,
                    lt: endOfDay,
                },
                limit: 100,
                starting_after: startingAfter,
            });

            for (const pi of response.data) {
                payments.set(pi.id, pi);
            }

            hasMore = response.has_more;
            if (response.data.length > 0) {
                startingAfter = response.data[response.data.length - 1].id;
            }
        }

        return payments;
    }

    /**
     * Compare local payments with PSP records
     */
    private async comparePayments(
        recordId: string,
        provider: string,
        localPayments: PaymentEntity[],
        pspPayments: Map<string, Stripe.PaymentIntent>,
    ): Promise<DiscrepancyEntity[]> {
        const discrepancies: Partial<DiscrepancyEntity>[] = [];

        // Check each local payment against PSP
        for (const local of localPayments) {
            const pspId = local.stripePaymentIntentId;

            if (!pspId) {
                // Missing PSP reference
                discrepancies.push({
                    recordId,
                    paymentId: local.id,
                    type: DiscrepancyType.MISSING_IN_PSP,
                    provider,
                    localData: this.serializePayment(local),
                    pspData: {},
                    description: 'Local payment has no PSP reference',
                });
                continue;
            }

            const psp = pspPayments.get(pspId);

            if (!psp) {
                // Payment not found in PSP
                discrepancies.push({
                    recordId,
                    paymentId: local.id,
                    externalId: pspId,
                    type: DiscrepancyType.MISSING_IN_PSP,
                    provider,
                    localData: this.serializePayment(local),
                    pspData: {},
                    description: `Payment ${pspId} not found in ${provider}`,
                });
                continue;
            }

            // Check amount match
            const localAmountCents = local.amount;
            const pspAmountCents = psp.amount;

            if (localAmountCents !== pspAmountCents) {
                discrepancies.push({
                    recordId,
                    paymentId: local.id,
                    externalId: pspId,
                    type: DiscrepancyType.AMOUNT_MISMATCH,
                    provider,
                    localData: this.serializePayment(local),
                    pspData: { amount: pspAmountCents, currency: psp.currency },
                    description: `Amount mismatch: local=${localAmountCents}, psp=${pspAmountCents}`,
                    amountDifference: Math.abs(localAmountCents - pspAmountCents),
                });
            }

            // Check currency match
            if (local.currency?.toLowerCase() !== psp.currency?.toLowerCase()) {
                discrepancies.push({
                    recordId,
                    paymentId: local.id,
                    externalId: pspId,
                    type: DiscrepancyType.CURRENCY_MISMATCH,
                    provider,
                    localData: this.serializePayment(local),
                    pspData: { currency: psp.currency },
                    description: `Currency mismatch: local=${local.currency}, psp=${psp.currency}`,
                });
            }

            // Remove from PSP map (to find orphans later)
            pspPayments.delete(pspId);
        }

        // Check for payments in PSP but not in local DB
        for (const [pspId, psp] of pspPayments) {
            if (psp.status === 'succeeded') {
                discrepancies.push({
                    recordId,
                    externalId: pspId,
                    type: DiscrepancyType.MISSING_IN_LOCAL,
                    provider,
                    localData: {},
                    pspData: {
                        id: pspId,
                        amount: psp.amount,
                        currency: psp.currency,
                        status: psp.status,
                    },
                    description: `Payment ${pspId} found in ${provider} but not in local DB`,
                    amountDifference: psp.amount,
                });
            }
        }

        // Save discrepancies
        if (discrepancies.length > 0) {
            return this.reconciliationRepository.createDiscrepancies(discrepancies);
        }

        return [];
    }

    /**
     * Serialize payment for storage
     */
    private serializePayment(payment: PaymentEntity): Record<string, any> {
        return {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            stripePaymentIntentId: payment.stripePaymentIntentId,
            createdAt: payment.createdAt,
        };
    }

    /**
     * Manual reconciliation trigger (for API endpoint)
     */
    async triggerReconciliation(
        provider: string,
        date: Date,
    ): Promise<ReconciliationRecordEntity> {
        this.logger.log(`Manual reconciliation triggered for ${provider} on ${date.toISOString()}`);
        return this.reconcilePayments(provider, date);
    }

    /**
     * Get reconciliation report
     */
    async getReconciliationReport(
        startDate: Date,
        endDate: Date,
        provider?: string,
    ): Promise<{
        records: ReconciliationRecordEntity[];
        summary: {
            totalRecords: number;
            totalTransactions: number;
            totalDiscrepancies: number;
            totalDiscrepancyAmount: number;
        };
    }> {
        const records = await this.reconciliationRepository.findRecordsByDateRange(
            startDate,
            endDate,
            provider,
        );

        const summary = records.reduce(
            (acc, r) => ({
                totalRecords: acc.totalRecords + 1,
                totalTransactions: acc.totalTransactions + r.totalTransactions,
                totalDiscrepancies: acc.totalDiscrepancies + r.discrepancyCount,
                totalDiscrepancyAmount: acc.totalDiscrepancyAmount + Number(r.discrepancyAmount),
            }),
            { totalRecords: 0, totalTransactions: 0, totalDiscrepancies: 0, totalDiscrepancyAmount: 0 },
        );

        return { records, summary };
    }
}
