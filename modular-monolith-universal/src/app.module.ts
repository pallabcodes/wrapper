import { Module } from '@nestjs/common';
import { TemplateModule } from './modules/template/template.module';
import { SharedModule } from './modules/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    TemplateModule,
    // Add more feature modules here as you create them
    // e.g., UserModule, OrderModule, PaymentModule
  ],
})
export class AppModule { }
