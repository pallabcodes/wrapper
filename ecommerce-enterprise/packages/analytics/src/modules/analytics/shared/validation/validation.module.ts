import { Global, Module } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { ValidationPipe } from './validation.pipe';

@Global()
@Module({
  providers: [ValidationService, ValidationPipe],
  exports: [ValidationService, ValidationPipe],
})
export class ValidationModule {}
