import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VersioningService } from './versioning.service';
import { VersioningGuard } from './versioning.guard';
import { VersioningOptions } from './versioning.types';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: VersioningService,
      useFactory: (configService: ConfigService) => {
        const options: VersioningOptions = {
          defaultVersion: configService.get('API_DEFAULT_VERSION', '1'),
          supportedVersions: configService.get('API_SUPPORTED_VERSIONS', '1,2').split(','),
          headerName: configService.get('API_VERSION_HEADER', 'API-Version'),
          queryParamName: configService.get('API_VERSION_QUERY', 'version'),
          acceptHeaderPattern: configService.get('API_ACCEPT_PATTERN', 'application/vnd.api+json;version={version}'),
          stripVersionFromResponse: configService.get('API_STRIP_VERSION_FROM_RESPONSE', 'false') === 'true',
          validateVersion: (version: string) => {
            const supportedVersions = configService.get('API_SUPPORTED_VERSIONS', '1,2').split(',');
            return supportedVersions.includes(version);
          },
        };
        return new VersioningService(options);
      },
      inject: [ConfigService],
    },
    VersioningGuard,
  ],
  exports: [VersioningService, VersioningGuard],
})
export class VersioningModule {}
