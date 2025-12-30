// This is a standalone tes/demo script to test the gRPC service manually so if the rate-limtier service is running then `cd services/rate-limiter && npx ts-node scripts/grpc-client.ts` 

// Just like quickly test REST API endpoint through curl i.e. as follows

// # You don't import curl in your code
// # You just run it manually to test
// curl http://localhost:3001/check \
//   -X POST \
//   -H "Content-Type: application/json" \
//   -d '{"clientId":"test","resource":"/api"}'

// run this script for gRPC.

// # You don't import this script in your code  
// # You just run it manually to test
// npx ts-node scripts/grpc-client.ts

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader'; // at runtime, parses .proto files into JavaScript objects Service classes Method functions, Request/Response constructors Type validation
import { join } from 'path';

const PROTO_PATH = join(__dirname, '../../../packages/proto/ratelimiter.proto');

// Takes the parsed proto definition and creates the actual gRPC service classes and methods. This is where the .proto file becomes executable JavaScript code.
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

// This creates JavaScript objects from .proto at RUNTIME
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

// @ts-expect-error becomes runtime JavaScript objects
const rateLimiterService = protoDescriptor.ratelimiter.RateLimiterService;

// Creates a new gRPC client for the RateLimiterService
const client = new rateLimiterService(
    'localhost:50051',
    grpc.credentials.createInsecure()
);

console.log('⚡ Connecting to gRPC Service at localhost:50051...');

// Makes a request to the RateLimiterService's Check method as soon this check method called wherever this rRPC route is registered, executes
// So, just think of below requesting to an endpoint, now instead of endpoint, we have a method so as this method called, its controller will be executed
client.Check({ client_id: 'grpc-test-user', resource: '/grpc-resource', cost: 1 }, (err: any, response: any) => {
    if (err) {
        console.error('❌ Error:', err);
    } else {
        console.log('✅ Response:', response);
    }
});
