import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { AppModule } from './app.module';

let cachedApp: express.Express | undefined;

export async function bootstrapExpress(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  const expressInstance = express();
  const adapter = new ExpressAdapter(expressInstance);
  const app = await NestFactory.create(AppModule, adapter as any);
  await app.init();
  cachedApp = expressInstance;
  return expressInstance;
}
