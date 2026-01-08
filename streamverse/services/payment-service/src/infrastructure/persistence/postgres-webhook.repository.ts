import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEventEntity } from './entities/webhook-event.entity';
import { IWebhookRepository } from '../../domain/ports/webhook-repository.port';

@Injectable()
export class PostgresWebhookRepository implements IWebhookRepository {
    constructor(
        @InjectRepository(WebhookEventEntity)
        private readonly repository: Repository<WebhookEventEntity>,
    ) { }

    async exists(id: string, provider: string = 'stripe'): Promise<boolean> {
        const count = await this.repository.count({
            where: { id, provider }
        });
        return count > 0;
    }

    async save(id: string, provider: string = 'stripe'): Promise<void> {
        const entity = new WebhookEventEntity();
        entity.id = id;
        entity.provider = provider;
        await this.repository.save(entity);
    }
}
