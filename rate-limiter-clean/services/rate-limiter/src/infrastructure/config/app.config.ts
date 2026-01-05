export interface AppConfig {
    redis: {
        host: string;
        port: number;
    };
    kafka: {
        broker: string;
    };
    rateLimit: {
        capacity: number;
        refillRate: number;
    };
}

export const config: AppConfig = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    kafka: {
        broker: process.env.KAFKA_BROKER || 'localhost:9092',
    },
    rateLimit: {
        capacity: parseInt(process.env.RATE_LIMIT_CAPACITY || '100', 10),
        refillRate: parseFloat(process.env.RATE_LIMIT_REFILL_RATE || '1.67'),
    },
};
