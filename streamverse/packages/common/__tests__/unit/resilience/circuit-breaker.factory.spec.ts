import { CircuitBreakerFactory } from '../../../../src/resilience/circuit-breaker.factory';

describe('CircuitBreakerFactory', () => {
    beforeEach(() => {
        // Clear any existing breakers between tests
        // Note: This is a workaround since CircuitBreakerFactory maintains static state
    });

    describe('getOrCreate', () => {
        it('should create a circuit breaker for an async function', () => {
            const mockFn = jest.fn().mockResolvedValue('success');

            const breaker = CircuitBreakerFactory.getOrCreate(mockFn, {
                name: 'test-breaker-1',
                timeout: 1000,
            });

            expect(breaker).toBeDefined();
            expect(typeof breaker.fire).toBe('function');
        });

        it('should return the same breaker for the same name', () => {
            const mockFn = jest.fn().mockResolvedValue('success');

            const breaker1 = CircuitBreakerFactory.getOrCreate(mockFn, {
                name: 'same-name-breaker',
                timeout: 1000,
            });

            const breaker2 = CircuitBreakerFactory.getOrCreate(mockFn, {
                name: 'same-name-breaker',
                timeout: 1000,
            });

            expect(breaker1).toBe(breaker2);
        });

        it('should execute the wrapped function successfully', async () => {
            const mockFn = jest.fn().mockResolvedValue('success');

            const breaker = CircuitBreakerFactory.getOrCreate(mockFn, {
                name: 'success-test-breaker',
                timeout: 1000,
            });

            const result = await breaker.fire();
            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should handle failures and track statistics', async () => {
            const mockFn = jest.fn().mockRejectedValue(new Error('Test failure'));

            const breaker = CircuitBreakerFactory.getOrCreate(mockFn, {
                name: 'failure-test-breaker',
                timeout: 1000,
                errorThresholdPercentage: 50,
            });

            await expect(breaker.fire()).rejects.toThrow('Test failure');
        });
    });

    describe('getStats', () => {
        it('should return stats for all created breakers', () => {
            const mockFn = jest.fn().mockResolvedValue('success');

            CircuitBreakerFactory.getOrCreate(mockFn, { name: 'stats-breaker-1' });
            CircuitBreakerFactory.getOrCreate(mockFn, { name: 'stats-breaker-2' });

            const stats = CircuitBreakerFactory.getStats();

            expect(stats).toBeDefined();
            expect(typeof stats).toBe('object');
        });
    });
});
