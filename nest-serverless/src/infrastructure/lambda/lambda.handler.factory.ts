/**
 * Lambda Handler Factory
 * 
 * Creates NestJS application context for Lambda functions
 * Handles cold start optimization by caching the app instance
 * 
 * This is a serverless-specific adapter in Hexagonal Architecture
 */
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../../app.module';

let cachedApp: INestApplication | null = null;

/**
 * Get or create NestJS application instance
 * Caches the instance to optimize cold starts
 */
export async function getApp(): Promise<INestApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  // Create NestJS application
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  
  cachedApp = await NestFactory.create(AppModule, adapter, {
    logger: false, // Disable logger for Lambda (use CloudWatch)
  });

  // Enable CORS
  cachedApp.enableCors();

  // Initialize the app
  await cachedApp.init();

  return cachedApp;
}

/**
 * Reset cached app (useful for testing)
 */
export function resetApp(): void {
  cachedApp = null;
}

