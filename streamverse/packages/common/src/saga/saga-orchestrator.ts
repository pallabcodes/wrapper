import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * Saga Step Status
 */
export enum SagaStepStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    COMPENSATING = 'COMPENSATING',
    COMPENSATED = 'COMPENSATED',
}

/**
 * Saga Status
 */
export enum SagaStatus {
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    COMPENSATING = 'COMPENSATING',
    COMPENSATED = 'COMPENSATED',
}

/**
 * Saga Step Definition
 */
export interface SagaStep<TContext> {
    name: string;
    execute: (context: TContext) => Promise<TContext>;
    compensate: (context: TContext) => Promise<TContext>;
}

/**
 * Saga Step Execution Result
 */
interface StepResult {
    name: string;
    status: SagaStepStatus;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
}

/**
 * Saga Execution State
 */
export interface SagaState<TContext> {
    id: string;
    name: string;
    status: SagaStatus;
    context: TContext;
    steps: StepResult[];
    currentStep: number;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
}

/**
 * Saga Orchestrator
 * 
 * Implements the Saga Pattern for distributed transactions.
 * Each saga is a sequence of steps that either all succeed or
 * are all compensated (rolled back) on failure.
 */
@Injectable()
export class SagaOrchestrator {
    private readonly logger = new Logger(SagaOrchestrator.name);
    private readonly activeSagas = new Map<string, SagaState<any>>();

    /**
     * Execute a saga with the given steps
     */
    async execute<TContext>(
        name: string,
        steps: SagaStep<TContext>[],
        initialContext: TContext,
    ): Promise<SagaState<TContext>> {
        const sagaId = uuidv4();

        const state: SagaState<TContext> = {
            id: sagaId,
            name,
            status: SagaStatus.RUNNING,
            context: initialContext,
            steps: steps.map((s) => ({
                name: s.name,
                status: SagaStepStatus.PENDING,
                startedAt: new Date(),
            })),
            currentStep: 0,
            startedAt: new Date(),
        };

        this.activeSagas.set(sagaId, state);
        this.logger.log(`Starting saga ${name} (${sagaId}) with ${steps.length} steps`);

        try {
            // Execute each step in order
            for (let i = 0; i < steps.length; i++) {
                state.currentStep = i;
                const step = steps[i];
                const stepState = state.steps[i];

                this.logger.log(`Executing step ${i + 1}/${steps.length}: ${step.name}`);
                stepState.status = SagaStepStatus.RUNNING;
                stepState.startedAt = new Date();

                try {
                    state.context = await step.execute(state.context);
                    stepState.status = SagaStepStatus.COMPLETED;
                    stepState.completedAt = new Date();
                    this.logger.log(`Step ${step.name} completed`);
                } catch (error) {
                    stepState.status = SagaStepStatus.FAILED;
                    stepState.completedAt = new Date();
                    stepState.error = error.message;
                    this.logger.error(`Step ${step.name} failed: ${error.message}`);

                    // Trigger compensation
                    await this.compensate(state, steps, i);
                    return state;
                }
            }

            // All steps completed successfully
            state.status = SagaStatus.COMPLETED;
            state.completedAt = new Date();
            this.logger.log(`Saga ${name} (${sagaId}) completed successfully`);

        } finally {
            // Cleanup after some time
            setTimeout(() => this.activeSagas.delete(sagaId), 300000); // 5 minutes
        }

        return state;
    }

    /**
     * Compensate (rollback) completed steps in reverse order
     */
    private async compensate<TContext>(
        state: SagaState<TContext>,
        steps: SagaStep<TContext>[],
        failedStepIndex: number,
    ): Promise<void> {
        state.status = SagaStatus.COMPENSATING;
        this.logger.log(`Starting compensation for saga ${state.id} from step ${failedStepIndex}`);

        // Compensate in reverse order (from failed step - 1 back to 0)
        for (let i = failedStepIndex - 1; i >= 0; i--) {
            const step = steps[i];
            const stepState = state.steps[i];

            // Only compensate completed steps
            if (stepState.status !== SagaStepStatus.COMPLETED) {
                continue;
            }

            this.logger.log(`Compensating step ${step.name}`);
            stepState.status = SagaStepStatus.COMPENSATING;

            try {
                state.context = await step.compensate(state.context);
                stepState.status = SagaStepStatus.COMPENSATED;
                this.logger.log(`Step ${step.name} compensated`);
            } catch (error) {
                // Compensation failed - this is critical
                this.logger.error(`CRITICAL: Compensation failed for step ${step.name}: ${error.message}`);
                stepState.error = `Compensation failed: ${error.message}`;
                // Continue compensating other steps
            }
        }

        state.status = SagaStatus.COMPENSATED;
        state.completedAt = new Date();
        state.error = `Saga failed at step ${failedStepIndex}, compensation completed`;
        this.logger.log(`Saga ${state.id} compensation completed`);
    }

    /**
     * Get saga state by ID
     */
    getSagaState(sagaId: string): SagaState<any> | undefined {
        return this.activeSagas.get(sagaId);
    }

    /**
     * Get all active sagas
     */
    getActiveSagas(): SagaState<any>[] {
        return Array.from(this.activeSagas.values());
    }
}
