import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

/**
 * Application Bootstrap Service
 * 
 * Demonstrates:
 * 1. Accessing IOC container via ModuleRef
 * 2. OnApplicationBootstrap lifecycle hook
 * 3. OnApplicationShutdown lifecycle hook
 * 
 * When to use OnApplicationBootstrap:
 * - Initialize connections (database, Redis, etc.)
 * - Start background workers
 * - Warm up caches
 * - Register dynamic routes
 * - Validate configuration
 * 
 * When to use OnApplicationShutdown:
 * - Close database connections
 * - Stop background workers
 * - Clean up resources
 * - Save state
 */
@Injectable()
export class AppBootstrapService implements OnApplicationBootstrap, OnApplicationShutdown {
  private isShuttingDown = false;

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Called after all modules have been initialized
   * This is where you can access the IOC container and perform startup tasks
   */
  async onApplicationBootstrap() {
    console.log('Application is bootstrapping...');

    // Access IOC container to get services dynamically
    try {
      // Example: Get a service by token (could be Symbol, string, or class)
      // const logger = this.moduleRef.get(LOGGER_TOKEN, { strict: false });
      
      // Example: Get a service by class
      // const configService = this.moduleRef.get(ConfigService);
      
      // Example: Initialize database connections
      await this.initializeConnections();
      
      // Example: Start background workers
      await this.startBackgroundWorkers();
      
      // Example: Warm up caches
      await this.warmUpCaches();
      
      console.log('Application bootstrap completed successfully');
    } catch (error) {
      console.error('Error during application bootstrap:', error);
      throw error;
    }
  }

  /**
   * Called when application is shutting down
   * Use this for graceful shutdown
   */
  async onApplicationShutdown(signal?: string) {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    console.log(`Application is shutting down (signal: ${signal || 'unknown'})...`);

    try {
      // Close database connections
      await this.closeConnections();
      
      // Stop background workers
      await this.stopBackgroundWorkers();
      
      // Clean up resources
      await this.cleanupResources();
      
      console.log('Application shutdown completed gracefully');
    } catch (error) {
      console.error('Error during application shutdown:', error);
    }
  }

  private async initializeConnections(): Promise<void> {
    // Initialize database, Redis, etc.
    console.log('Initializing connections...');
  }

  private async startBackgroundWorkers(): Promise<void> {
    // Start background job processors, schedulers, etc.
    console.log('Starting background workers...');
  }

  private async warmUpCaches(): Promise<void> {
    // Preload frequently accessed data
    console.log('Warming up caches...');
  }

  private async closeConnections(): Promise<void> {
    // Close all open connections
    console.log('Closing connections...');
  }

  private async stopBackgroundWorkers(): Promise<void> {
    // Stop all background processes
    console.log('Stopping background workers...');
  }

  private async cleanupResources(): Promise<void> {
    // Clean up temporary files, memory, etc.
    console.log('Cleaning up resources...');
  }
}

