import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

/**
 * Infrastructure Entity: WebhookEvent
 *
 * Stores processed Stripe (or other provider) webhook event IDs.
 * Used to enforce strict idempotency at the entry gate.
 */
@Entity('webhook_events')
export class WebhookEventEntity {
    /**
     * The unique Event ID from the provider (e.g., evt_12345)
     */
    @PrimaryColumn('varchar', { length: 255 })
    id!: string;

    /**
     * Provider name (e.g., 'stripe') - allows supporting multiple providers
     */
    @PrimaryColumn('varchar', { length: 50, default: 'stripe' })
    provider!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
