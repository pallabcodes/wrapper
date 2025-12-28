// Saga Definition and Types

export interface SagaContext {
  [key: string]: any;
  correlationId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface SagaStep {
  name: string;
  action: (context: SagaContext) => Promise<void>;
  compensation?: (context: SagaContext) => Promise<void>;
  timeout?: number; // Timeout in milliseconds
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  exponential?: boolean;
}

export interface SagaDefinition {
  id: string;
  name: string;
  description?: string;
  steps: SagaStep[];
  timeout?: number; // Overall saga timeout
  metadata?: Record<string, any>;
}

// Step builder for fluent API
export class SagaStepBuilder {
  private step: Partial<SagaStep> = {};

  name(name: string): SagaStepBuilder {
    this.step.name = name;
    return this;
  }

  action(action: (context: SagaContext) => Promise<void>): SagaStepBuilder {
    this.step.action = action;
    return this;
  }

  compensation(compensation: (context: SagaContext) => Promise<void>): SagaStepBuilder {
    this.step.compensation = compensation;
    return this;
  }

  timeout(timeoutMs: number): SagaStepBuilder {
    this.step.timeout = timeoutMs;
    return this;
  }

  retryPolicy(policy: RetryPolicy): SagaStepBuilder {
    this.step.retryPolicy = policy;
    return this;
  }

  build(): SagaStep {
    if (!this.step.name || !this.step.action) {
      throw new Error('Saga step must have a name and action');
    }
    return this.step as SagaStep;
  }
}

// Saga builder for fluent API
export class SagaBuilder {
  private saga: Partial<SagaDefinition> = {
    steps: [],
  };

  id(id: string): SagaBuilder {
    this.saga.id = id;
    return this;
  }

  name(name: string): SagaBuilder {
    this.saga.name = name;
    return this;
  }

  description(description: string): SagaBuilder {
    this.saga.description = description;
    return this;
  }

  step(step: SagaStep): SagaBuilder {
    this.saga.steps!.push(step);
    return this;
  }

  steps(steps: SagaStep[]): SagaBuilder {
    this.saga.steps = [...(this.saga.steps || []), ...steps];
    return this;
  }

  timeout(timeoutMs: number): SagaBuilder {
    this.saga.timeout = timeoutMs;
    return this;
  }

  metadata(metadata: Record<string, any>): SagaBuilder {
    this.saga.metadata = metadata;
    return this;
  }

  build(): SagaDefinition {
    if (!this.saga.id || !this.saga.name || !this.saga.steps?.length) {
      throw new Error('Saga must have an id, name, and at least one step');
    }
    return this.saga as SagaDefinition;
  }
}

// Helper functions
export function createSagaStep(name: string, action: (context: SagaContext) => Promise<void>) {
  return new SagaStepBuilder().name(name).action(action);
}

export function createSaga(id: string, name: string) {
  return new SagaBuilder().id(id).name(name);
}
