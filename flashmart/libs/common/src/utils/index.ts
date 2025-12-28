// Shared utilities for FlashMart services

export function generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
): Promise<T> {
    return new Promise(async (resolve, reject) => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await fn();
                resolve(result);
                return;
            } catch (error) {
                if (attempt === maxRetries) {
                    reject(error);
                    return;
                }
                const delay = baseDelay * Math.pow(2, attempt);
                await sleep(delay);
            }
        }
    });
}
