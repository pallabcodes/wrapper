/**
 * Token Bucket Test
 *
 * Run: npx ts-node src/domain/token-bucket.test.ts
 */
import { tryConsume, createBucket, TokenBucketConfig } from './token-bucket';

const config: TokenBucketConfig = {
    capacity: 10,      // 10 requests max
    refillRate: 1,     // 1 request per second
};

console.log('=== Token Bucket Test ===\n');

// Create a bucket
let state = createBucket(config.capacity);
console.log('Initial state:', state);

// Consume 5 tokens
console.log('\n--- Consuming 5 tokens ---');
const r1 = tryConsume(config, state, 5);
console.log('Result:', r1.result);
state = r1.newState;

// Consume 4 more tokens
console.log('\n--- Consuming 4 more tokens ---');
const r2 = tryConsume(config, state, 4);
console.log('Result:', r2.result);
state = r2.newState;

// Try to consume 5 more (should fail - only 1 left)
console.log('\n--- Trying to consume 5 more (should fail) ---');
const r3 = tryConsume(config, state, 5);
console.log('Result:', r3.result);

console.log('\n✅ Test complete!');
