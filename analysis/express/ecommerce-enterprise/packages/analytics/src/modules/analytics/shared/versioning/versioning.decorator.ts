import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiQuery } from '@nestjs/swagger';

export const VERSION_KEY = 'version';

export const Version = (version: string) => SetMetadata(VERSION_KEY, version);

export const ApiVersion = (version: string) =>
  applyDecorators(
    Version(version),
    ApiHeader({
      name: 'API-Version',
      description: 'API version',
      required: false,
      example: version,
    }),
    ApiQuery({
      name: 'version',
      description: 'API version (alternative to header)',
      required: false,
      example: version,
    }),
  );

// Convenience decorators for common versions
export const V1 = () => ApiVersion('1');
export const V2 = () => ApiVersion('2');
export const V3 = () => ApiVersion('3');

// Deprecated version decorator
export const DeprecatedVersion = (version: string, alternativeVersion?: string) =>
  applyDecorators(
    Version(version),
    ApiHeader({
      name: 'API-Version',
      description: `API version (deprecated, use ${alternativeVersion || 'latest'} instead)`,
      required: false,
      example: version,
      deprecated: true,
    }),
  );
