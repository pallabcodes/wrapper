import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OrderEntity, OrderEventEntity, OrderEventType } from './entities/order.orm-entity';
import { Order, OrderStatus } from './entities/order.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(OrderEntity)
        private readonly orderRepo: Repository<OrderEntity>,
        @InjectRepository(OrderEventEntity)
        private readonly eventRepo: Repository<OrderEventEntity>,
        private readonly dataSource: DataSource,
    ) { }

    async createOrder(userId: string, items: { productId: string; quantity: number; price: number }[]): Promise<Order> {
        const orderId = uuidv4();
        const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Use transaction for consistency
        return this.dataSource.transaction(async manager => {
            // 1. Append event
            const event = manager.create(OrderEventEntity, {
                orderId,
                eventType: OrderEventType.ORDER_CREATED,
                payload: { userId, items, totalAmount },
                version: 1,
            });
            await manager.save(event);

            // 2. Create/update materialized view
            const order = manager.create(OrderEntity, {
                id: orderId,
                userId,
                items,
                totalAmount,
                status: 'PENDING',
                version: 1,
                updatedAt: new Date(),
            });
            await manager.save(order);

            return this.toGraphQL(order);
        });
    }

    async findById(id: string): Promise<Order | null> {
        const entity = await this.orderRepo.findOne({ where: { id } });
        return entity ? this.toGraphQL(entity) : null;
    }

    async findByUserId(userId: string): Promise<Order[]> {
        const entities = await this.orderRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
        return entities.map(e => this.toGraphQL(e));
    }

    async updateStatus(orderId: string, status: OrderStatus, paymentId?: string): Promise<Order> {
        return this.dataSource.transaction(async manager => {
            const order = await manager.findOne(OrderEntity, { where: { id: orderId } });
            if (!order) throw new Error('Order not found');

            const eventType = this.statusToEventType(status);
            const event = manager.create(OrderEventEntity, {
                orderId,
                eventType,
                payload: { status, paymentId },
                version: order.version + 1,
            });
            await manager.save(event);

            order.status = status;
            if (paymentId) order.paymentId = paymentId;
            order.version += 1;
            order.updatedAt = new Date();
            await manager.save(order);

            return this.toGraphQL(order);
        });
    }

    async getOrderHistory(orderId: string): Promise<OrderEventEntity[]> {
        return this.eventRepo.find({ where: { orderId }, order: { version: 'ASC' } });
    }

    private statusToEventType(status: OrderStatus): OrderEventType {
        const map: Record<string, OrderEventType> = {
            PAYMENT_PENDING: OrderEventType.PAYMENT_PENDING,
            CONFIRMED: OrderEventType.PAYMENT_CONFIRMED,
            SHIPPED: OrderEventType.ORDER_SHIPPED,
            DELIVERED: OrderEventType.ORDER_DELIVERED,
            CANCELLED: OrderEventType.ORDER_CANCELLED,
        };
        return map[status] || OrderEventType.ORDER_CREATED;
    }

    private toGraphQL(e: OrderEntity): Order {
        return {
            id: e.id,
            userId: e.userId,
            items: e.items,
            totalAmount: Number(e.totalAmount),
            status: e.status as OrderStatus,
            paymentId: e.paymentId,
            createdAt: e.createdAt,
        };
    }
}
