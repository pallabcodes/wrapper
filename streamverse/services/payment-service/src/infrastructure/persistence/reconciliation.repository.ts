import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
    ReconciliationRecordEntity,
    DiscrepancyEntity,
    ReconciliationStatus,
} from './entities/reconciliation.entity';

/**
 * Reconciliation Repository
 * Handles persistence of reconciliation records and discrepancies
 */
@Injectable()
export class ReconciliationRepository {
    constructor(
        @InjectRepository(ReconciliationRecordEntity)
        private readonly recordRepository: Repository<ReconciliationRecordEntity>,
        @InjectRepository(DiscrepancyEntity)
        private readonly discrepancyRepository: Repository<DiscrepancyEntity>,
    ) { }

    // ==================== Reconciliation Records ====================

    async createRecord(data: Partial<ReconciliationRecordEntity>): Promise<ReconciliationRecordEntity> {
        const record = this.recordRepository.create(data);
        return this.recordRepository.save(record);
    }

    async updateRecord(
        id: string,
        data: Partial<ReconciliationRecordEntity>,
    ): Promise<ReconciliationRecordEntity> {
        await this.recordRepository.update(id, data);
        return this.findRecordById(id);
    }

    async findRecordById(id: string): Promise<ReconciliationRecordEntity | null> {
        return this.recordRepository.findOne({ where: { id } });
    }

    async findRecordsByStatus(status: ReconciliationStatus): Promise<ReconciliationRecordEntity[]> {
        return this.recordRepository.find({
            where: { status },
            order: { createdAt: 'DESC' },
        });
    }

    async findRecordsByDateRange(
        startDate: Date,
        endDate: Date,
        provider?: string,
    ): Promise<ReconciliationRecordEntity[]> {
        const where: any = {
            reconciliationDate: Between(startDate, endDate),
        };
        if (provider) {
            where.provider = provider;
        }
        return this.recordRepository.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }

    async getLatestRecordByProvider(provider: string): Promise<ReconciliationRecordEntity | null> {
        return this.recordRepository.findOne({
            where: { provider },
            order: { reconciliationDate: 'DESC' },
        });
    }

    // ==================== Discrepancies ====================

    async createDiscrepancy(data: Partial<DiscrepancyEntity>): Promise<DiscrepancyEntity> {
        const discrepancy = this.discrepancyRepository.create(data);
        return this.discrepancyRepository.save(discrepancy);
    }

    async createDiscrepancies(data: Partial<DiscrepancyEntity>[]): Promise<DiscrepancyEntity[]> {
        const discrepancies = this.discrepancyRepository.create(data);
        return this.discrepancyRepository.save(discrepancies);
    }

    async findDiscrepanciesByRecord(recordId: string): Promise<DiscrepancyEntity[]> {
        return this.discrepancyRepository.find({
            where: { recordId },
            order: { createdAt: 'DESC' },
        });
    }

    async findUnresolvedDiscrepancies(provider?: string): Promise<DiscrepancyEntity[]> {
        const where: any = { resolved: false };
        if (provider) {
            where.provider = provider;
        }
        return this.discrepancyRepository.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }

    async resolveDiscrepancy(
        id: string,
        resolution: string,
    ): Promise<DiscrepancyEntity> {
        await this.discrepancyRepository.update(id, {
            resolved: true,
            resolution,
            resolvedAt: new Date(),
        });
        return this.discrepancyRepository.findOne({ where: { id } });
    }

    async countDiscrepanciesByType(
        recordId: string,
    ): Promise<{ type: string; count: number }[]> {
        return this.discrepancyRepository
            .createQueryBuilder('d')
            .select('d.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .where('d.recordId = :recordId', { recordId })
            .groupBy('d.type')
            .getRawMany();
    }
}
