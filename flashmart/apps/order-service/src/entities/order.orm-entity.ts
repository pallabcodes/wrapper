import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum OrderEventType {
    ORDER_CREATED = 'ORDER_CREATED',
    PAYMENT_PENDING = 'PAYMENT_PENDING',
    PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    ORDER_SHIPPED = 'ORDER_SHIPPED',
    ORDER_DELIVERED = 'ORDER_DELIVERED',
    ORDER_CANCELLED = 'ORDER_CANCELLED',
}

// Event Sourcing: Store events, not state
@Entity('order_events')
export class OrderEventEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    orderId: string;

    @Column({ type: 'enum', enum: OrderEventType })
    eventType: OrderEventType;

    @Column('jsonb')
    payload: Record<string, any>;

    @Column()
    version: number;

    @CreateDateColumn()
    createdAt: Date;
}

// Materialized view for querying (rebuilt from events)
@Entity('orders')
export class OrderEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column('jsonb')
    items: { productId: string; quantity: number; price: number }[];

    @Column('decimal', { precision: 10, scale: 2 })
    totalAmount: number;

    @Column()
    status: string;

    @Column({ nullable: true })
    paymentId: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    updatedAt: Date;

    @Column({ default: 1 })
    version: number;
}
