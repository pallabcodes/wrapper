#!/usr/bin/env node

/**
 * Enterprise Zod Demo Runner
 * 
 * This script runs the comprehensive demonstration of our enterprise Zod integration.
 */

import { main } from './simple-demo';

// Run the demonstration
main().catch((error: unknown) => {
  console.error('Demo failed:', error);
  process.exit(1);
});
