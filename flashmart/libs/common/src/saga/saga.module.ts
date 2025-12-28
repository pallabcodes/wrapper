import { Module, Global } from '@nestjs/common';
import { SagaOrchestrator } from './saga-orchestrator';
import { OrderSaga } from './order-saga';

@Global()
@Module({
  providers: [
    SagaOrchestrator,
    OrderSaga,
  ],
  exports: [
    SagaOrchestrator,
    OrderSaga,
  ],
})
export class SagaModule {}
