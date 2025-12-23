import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AnalyticsModule } from '../src/modules/analytics/analytics.module';

async function main() {
  const app = await NestFactory.create(AnalyticsModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('Analytics API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const outDir = join(process.cwd(), 'openapi');
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, 'analytics.json');
  writeFileSync(outFile, JSON.stringify(document, null, 2));
  await app.close();
  // eslint-disable-next-line no-console
  console.log(`OpenAPI written to ${outFile}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


