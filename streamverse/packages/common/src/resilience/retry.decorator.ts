import { Logger } from '@nestjs/common';

export interface RetryOptions {
    maxRetries?: number;
    backoff?: number; // Initial backoff in ms
    exponential?: boolean;
}

/**
 * Decorator to retry a method/function upon failure
 */
export function Retry(options: RetryOptions = {}) {
    const maxRetries = options.maxRetries || 3;
    const backoff = options.backoff || 1000;
    const exponential = options.exponential !== false; // Default true
    const logger = new Logger('RetryDecorator');

    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            let retries = 0;

            while (true) {
                try {
                    return await originalMethod.apply(this, args);
                } catch (error: any) {
                    const errorMessage = error instanceof Error ? error.message : String(error);

                    if (retries >= maxRetries) {
                        logger.error(
                            `Method ${propertyKey} failed after ${retries} retries. Error: ${errorMessage}`
                        );
                        throw error;
                    }

                    retries++;

                    const delay = exponential
                        ? backoff * Math.pow(2, retries - 1)
                        : backoff;

                    logger.warn(
                        `Method ${propertyKey} failed. Retrying (${retries}/${maxRetries}) in ${delay}ms... Error: ${errorMessage}`
                    );

                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        };

        return descriptor;
    };
}
