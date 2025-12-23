import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class FlagsService {
  constructor(private readonly cfg: ConfigService) {}

  isEnabled(flagName: string, defaultValue = false): boolean {
    const key = `FLAG_${flagName.replace(/[^A-Z0-9_]/gi, '_').toUpperCase()}`;
    const raw = this.cfg.get<string>(key);
    if (raw == null) return defaultValue;
    return ['1', 'true', 'on', 'yes', 'enabled'].includes(String(raw).toLowerCase());
  }
}

@Global()
@Module({
  providers: [ConfigService, FlagsService],
  exports: [FlagsService],
})
export class FlagsModule {}


