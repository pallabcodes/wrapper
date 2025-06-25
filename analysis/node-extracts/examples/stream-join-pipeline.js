/**
 * Advanced Pattern: Stream Join (Enrichment)
 * 
 * This example demonstrates:
 *  - Joining two streams on a key (like SQL JOIN)
 *  - Enriching events with reference data
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

// Simulate reference/user data
const userData = {
  1: { name: 'Alice' },
  2: { name: 'Bob' },
  3: { name: 'Carol' }
};

// Simulate event stream
async function* events() {
  for (let i = 1; i <= 10; i++) {
    await new Promise(r => setTimeout(r, 40));
    yield { userId: (i % 3) + 1, event: `event-${i}` };
  }
}

// Join transform: enrich event with user info
function joinWithUser() {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const user = userData[chunk.userId];
      if (user) {
        this.push({ ...chunk, user });
      }
      callback();
    }
  });
}

const pipeline = from(events()).pipe(joinWithUser());

(async () => {
  console.log('Stream join pipeline started');
  for await (const enriched of pipeline) {
    console.log(`[enriched] ${enriched.event} by ${enriched.user.name}`);
  }
  console.log('Pipeline complete!');
})();