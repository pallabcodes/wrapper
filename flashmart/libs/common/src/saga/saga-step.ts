// Saga Step utilities and helpers
export interface SagaStepResult {
  success: boolean;
  data?: any;
  error?: string;
  compensationData?: any;
}

export interface SagaStepContext {
  stepId: string;
  sagaId: string;
  attempt: number;
  startTime: Date;
  timeout?: number;
}

/**
 * Execute a saga step with retry logic
 */
export async function executeSagaStep(
  step: (context: any) => Promise<void>,
  context: any,
  retryPolicy?: { maxAttempts: number; backoffMs: number; exponential?: boolean }
): Promise<SagaStepResult> {
  const maxAttempts = retryPolicy?.maxAttempts || 1;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await step(context);
      return { success: true };
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        const backoffMs = retryPolicy?.exponential
          ? retryPolicy.backoffMs * Math.pow(2, attempt - 1)
          : retryPolicy?.backoffMs || 1000;

        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Step execution failed'
  };
}

/**
 * Execute compensation with error handling
 */
export async function executeCompensation(
  compensation: (context: any) => Promise<void>,
  context: any
): Promise<SagaStepResult> {
  try {
    await compensation(context);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Compensation failed: ${(error as Error).message}`
    };
  }
}

/**
 * Create a timeout wrapper for saga steps
 */
export function withTimeout<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  timeoutMs: number
): (...args: T) => Promise<R> {
  return (...args: T): Promise<R> => {
    return Promise.race([
      fn(...args),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  };
}

/**
 * Saga step execution tracker
 */
export class SagaStepTracker {
  private stepResults = new Map<string, SagaStepResult[]>();

  recordStepResult(sagaId: string, stepId: string, result: SagaStepResult): void {
    if (!this.stepResults.has(sagaId)) {
      this.stepResults.set(sagaId, []);
    }

    const sagaResults = this.stepResults.get(sagaId)!;
    const existingIndex = sagaResults.findIndex(r => (r as any).stepId === stepId);

    if (existingIndex >= 0) {
      sagaResults[existingIndex] = { ...result, stepId };
    } else {
      sagaResults.push({ ...result, stepId });
    }
  }

  getStepResults(sagaId: string): SagaStepResult[] {
    return this.stepResults.get(sagaId) || [];
  }

  getLastFailedStep(sagaId: string): SagaStepResult | null {
    const results = this.getStepResults(sagaId);
    return results.slice().reverse().find(r => !r.success) || null;
  }

  clearSagaResults(sagaId: string): void {
    this.stepResults.delete(sagaId);
  }
}
