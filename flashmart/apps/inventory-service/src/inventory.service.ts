import { Injectable } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

export interface ReservationResult {
    success: boolean;
    productId: string;
    quantity: number;
    remaining: number;
    message?: string;
}

@Injectable()
export class InventoryService {
    constructor(private readonly redis: RedisService) { }

    async getStock(productId: string): Promise<number> {
        return this.redis.getStock(productId);
    }

    async setStock(productId: string, quantity: number): Promise<void> {
        await this.redis.setStock(productId, quantity);
    }

    // Flash sale: atomic reservation at 50k/s
    async reserveStock(productId: string, quantity: number): Promise<ReservationResult> {
        const result = await this.redis.decrementStock(productId, quantity);

        if (result.success) {
            return {
                success: true,
                productId,
                quantity,
                remaining: result.remaining,
            };
        }

        return {
            success: false,
            productId,
            quantity,
            remaining: result.remaining,
            message: `Insufficient stock. Only ${result.remaining} available.`,
        };
    }

    // Rollback reservation (e.g., payment failed)
    async releaseStock(productId: string, quantity: number): Promise<void> {
        const key = `stock:${productId}`;
        // Use Redis INCRBY to add back
        for (let i = 0; i < quantity; i++) {
            await this.redis.incr(key);
        }
    }

    // Batch reservation for cart checkout
    async reserveMultiple(items: { productId: string; quantity: number }[]): Promise<{
        success: boolean;
        results: ReservationResult[];
    }> {
        const results: ReservationResult[] = [];
        const reserved: { productId: string; quantity: number }[] = [];

        for (const item of items) {
            const result = await this.reserveStock(item.productId, item.quantity);
            results.push(result);

            if (result.success) {
                reserved.push(item);
            } else {
                // Rollback all previously reserved items
                for (const r of reserved) {
                    await this.releaseStock(r.productId, r.quantity);
                }
                return { success: false, results };
            }
        }

        return { success: true, results };
    }
}
