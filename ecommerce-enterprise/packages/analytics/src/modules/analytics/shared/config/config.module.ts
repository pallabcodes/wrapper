import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validatedConfigSchema } from './config.schema';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: (config: Record<string, unknown>) => {
        const { error, value } = validatedConfigSchema.prefs({ errors: { label: 'key' } }).validate(config);
        if (error) {
          throw new Error(`Invalid configuration: ${error.message}`);
        }
        return value as Record<string, string>;
      },
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ValidatedConfigModule {}


