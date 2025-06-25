/**
 * Node.js Stream Pipeline Core - Repurposable Extraction
 *
 * This is the distilled, hacky, and ingenious core of Node.js's pipeline utility.
 * It composes multiple streams into a robust pipeline with automatic error and cleanup handling.
 *
 * You can repurpose this pattern for any async data processing chain (ETL, file processing, network proxies, etc).
 */

// Compose streams left-to-right, handling errors and cleanup
function pipeline(...streams) {
  if (streams.length < 2) throw new Error('pipeline requires at least two streams');
  let errorEmitted = false;

  // Pipe each stream to the next
  for (let i = 0; i < streams.length - 1; i++) {
    streams[i].on('error', onError);
    streams[i + 1].on('error', onError);
    streams[i].pipe(streams[i + 1]);
  }

  // Handle errors and cleanup
  function onError(err) {
    if (errorEmitted) return;
    errorEmitted = true;
    // Destroy all streams in the pipeline
    streams.forEach(s => s.destroy && s.destroy(err));
  }

  // Return the last stream (the output)
  return streams[streams.length - 1];
}

// Repurposing: Use pipeline to compose any async processing chain
// Example: Readable -> Transform -> Writable
/*
const { Readable } = require('./readable');
const { Transform } = require('./transform');
const { Writable } = require('./writable');

const src = new Readable({ ... });
const upper = new Transform({ ... });
const dest = new Writable({ ... });

pipeline(src, upper, dest);
*/

module.exports = { pipeline };

/*
Key takeaways for repurposing:
- Pipeline composes streams with robust error and cleanup handling.
- You can use this pattern for any async processing chain, not just streams.
- This is the backbone for ETL, file processing, and network proxy pipelines.
*/