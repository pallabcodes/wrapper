import { Injectable, Logger } from '@nestjs/common';
import { EventPublisher } from '../events';
import { SagaDefinition, SagaStep, SagaState, SagaContext } from './saga-definition';

export enum SagaStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  COMPENSATING = 'COMPENSATING',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
}

export interface SagaInstance {
  id: string;
  definitionId: string;
  status: SagaStatus;
  currentStep: number;
  context: SagaContext;
  startedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  compensationSteps: SagaStep[];
}

@Injectable()
export class SagaOrchestrator {
  private readonly logger = new Logger('SagaOrchestrator');
  private sagas = new Map<string, SagaDefinition>();
  private instances = new Map<string, SagaInstance>();

  constructor(private readonly eventPublisher: EventPublisher) {}

  /**
   * Register a saga definition
   */
  registerSaga(definition: SagaDefinition): void {
    this.sagas.set(definition.id, definition);
    this.logger.log(`Registered saga: ${definition.id}`);
  }

  /**
   * Start a new saga instance
   */
  async startSaga(sagaId: string, initialContext: SagaContext): Promise<string> {
    const definition = this.sagas.get(sagaId);
    if (!definition) {
      throw new Error(`Saga definition not found: ${sagaId}`);
    }

    const instanceId = `${sagaId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const instance: SagaInstance = {
      id: instanceId,
      definitionId: sagaId,
      status: SagaStatus.PENDING,
      currentStep: 0,
      context: { ...initialContext },
      startedAt: new Date(),
      compensationSteps: [],
    };

    this.instances.set(instanceId, instance);

    // Start executing the saga
    this.executeSaga(instance).catch(error => {
      this.logger.error(`Saga ${instanceId} failed:`, error);
      this.failSaga(instanceId, error);
    });

    return instanceId;
  }

  /**
   * Get saga instance status
   */
  getSagaStatus(instanceId: string): SagaInstance | null {
    return this.instances.get(instanceId) || null;
  }

  /**
   * Manually compensate a saga (for admin operations)
   */
  async compensateSaga(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Saga instance not found: ${instanceId}`);
    }

    if (instance.status !== SagaStatus.COMPLETED && instance.status !== SagaStatus.FAILED) {
      throw new Error(`Cannot compensate saga in status: ${instance.status}`);
    }

    instance.status = SagaStatus.COMPENSATING;

    // Execute compensation steps in reverse order
    for (let i = instance.compensationSteps.length - 1; i >= 0; i--) {
      const step = instance.compensationSteps[i];
      try {
        await step.compensation(instance.context);
        this.logger.log(`Compensated step ${i} for saga ${instanceId}`);
      } catch (error) {
        this.logger.error(`Compensation failed for step ${i} in saga ${instanceId}:`, error);
        // Continue compensating other steps even if one fails
      }
    }

    instance.status = SagaStatus.FAILED;
    instance.completedAt = new Date();
  }

  private async executeSaga(instance: SagaInstance): Promise<void> {
    const definition = this.sagas.get(instance.definitionId)!;
    instance.status = SagaStatus.RUNNING;

    try {
      for (let i = 0; i < definition.steps.length; i++) {
        const step = definition.steps[i];
        instance.currentStep = i;

        this.logger.log(`Executing step ${i} for saga ${instance.id}`);

        // Execute the step
        await step.action(instance.context);

        // Add compensation step
        if (step.compensation) {
          instance.compensationSteps.push(step);
        }

        // Publish step completion event
        await this.eventPublisher.publish({
          id: `saga-step-${instance.id}-${i}-${Date.now()}`,
          type: 'saga.step.completed',
          aggregateId: instance.id,
          aggregateType: 'saga',
          data: {
            sagaId: instance.definitionId,
            stepIndex: i,
            stepName: step.name,
          },
          metadata: {
            correlationId: instance.id,
            service: 'saga-orchestrator',
            version: '1.0',
            timestamp: new Date(),
          },
          timestamp: new Date(),
        } as any);
      }

      // All steps completed successfully
      instance.status = SagaStatus.COMPLETED;
      instance.completedAt = new Date();

      this.logger.log(`Saga ${instance.id} completed successfully`);

      // Publish completion event
      await this.eventPublisher.publish({
        id: `saga-completed-${instance.id}-${Date.now()}`,
        type: 'saga.completed',
        aggregateId: instance.id,
        aggregateType: 'saga',
        data: {
          sagaId: instance.definitionId,
          finalContext: instance.context,
        },
        metadata: {
          correlationId: instance.id,
          service: 'saga-orchestrator',
          version: '1.0',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      } as any);

    } catch (error) {
      this.logger.error(`Saga ${instance.id} failed at step ${instance.currentStep}:`, error);
      await this.failSaga(instance.id, error);
      throw error;
    }
  }

  private async failSaga(instanceId: string, error: any): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    instance.status = SagaStatus.FAILED;
    instance.failedAt = new Date();

    // Execute compensation steps in reverse order
    instance.status = SagaStatus.COMPENSATING;

    for (let i = instance.compensationSteps.length - 1; i >= 0; i--) {
      const step = instance.compensationSteps[i];
      try {
        await step.compensation!(instance.context);
        this.logger.log(`Compensated step ${i} for failed saga ${instanceId}`);
      } catch (compensationError) {
        this.logger.error(`Compensation failed for step ${i} in saga ${instanceId}:`, compensationError);
        // Log but continue with other compensations
      }
    }

    instance.status = SagaStatus.FAILED;

    // Publish failure event
    await this.eventPublisher.publish({
      id: `saga-failed-${instanceId}-${Date.now()}`,
      type: 'saga.failed',
      aggregateId: instanceId,
      aggregateType: 'saga',
      data: {
        sagaId: instance.definitionId,
        failedAtStep: instance.currentStep,
        error: error.message,
      },
      metadata: {
        correlationId: instanceId,
        service: 'saga-orchestrator',
        version: '1.0',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    } as any);
  }

  /**
   * Clean up completed sagas (for memory management)
   */
  cleanupCompletedSagas(maxAgeHours: number = 24): void {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

    for (const [instanceId, instance] of this.instances.entries()) {
      if ((instance.completedAt || instance.failedAt) &&
          (instance.completedAt?.getTime() || instance.failedAt?.getTime() || 0) < cutoffTime) {
        this.instances.delete(instanceId);
      }
    }

    this.logger.log(`Cleaned up old saga instances`);
  }
}
