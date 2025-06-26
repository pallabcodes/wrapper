/**
 * Advanced ETL: Streaming Data Enrichment
 * 
 * This example demonstrates:
 *  - Enriching records by calling an external API
 *  - Useful for adding geo, demographic, or lookup data in ETL
 */

const { Transform } = require('stream');

// Simulated external API call
async function fakeApiEnrich(id) {
  await new Promise(r => setTimeout(r, 30));
  return { extra: `info-for-${id}` };
}

// Simulated incoming records
async function* records() {
  for (let i = 1; i <= 5; i++) {
    await new Promise(r => setTimeout(r, 20));
    yield { id: i, value: `val${i}` };
  }
}

// Enrichment transform
function enrich() {
  return new Transform({
    objectMode: true,
    async transform(chunk, encoding, callback) {
      const enrichment = await fakeApiEnrich(chunk.id);
      this.push({ ...chunk, ...enrichment });
      callback();
    }
  });
}

(async () => {
  console.log('Enrichment pipeline started');
  const transformer = enrich();
  for await (const rec of records()) {
    transformer.write(rec);
  }
  transformer.end();

  for await (const enriched of transformer) {
    console.log('[Enriched]', enriched);
  }
  console.log('Enrichment pipeline complete!');
})();