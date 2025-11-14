/**
 * Worker Thread Implementation
 * 
 * This file runs in a separate thread and handles CPU-intensive tasks
 */

const { parentPort } = require('worker_threads');

parentPort.on('message', async (taskData) => {
  try {
    // Example: Heavy computation
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(i);
    }

    // Process the task data
    const processed = {
      ...taskData,
      processed: true,
      computationResult: result,
    };

    parentPort.postMessage(processed);
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
});

