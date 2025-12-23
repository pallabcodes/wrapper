Node Streams Toolkit
====================

Purpose
* Enterprise-flavored Node.js streams toolkit with typed APIs, backpressure-aware helpers, and optional native accelerators.

Key Pieces
* `src/core/enhanced-streams.service.ts` — core service, monitoring, audit log, backpressure-aware `pipeWithBackpressure` helper with retries.
* `src/apis/streams-api.ts` — high-level API facade; exposes stream creation and backpressure helper.
* `src/nestjs` — Nest module/decorators for DI-based use.
* Native stubs in `src/*.cc` act as placeholders for performance extensions.

Usage Sketch (TypeScript)
```ts
import { StreamsAPI } from '@ecommerce-enterprise/node-streams';
import { Readable, Writable } from 'stream';

const api = new StreamsAPI({ enableBackpressure: true });
const readable = Readable.from(['a', 'b', 'c']);
const writable = new Writable({
  write(chunk, _enc, cb) {
    // process chunk...
    cb();
  }
});

await api.pipeWithBackpressure(readable, writable, { maxRetries: 2, retryDelayMs: 200 });
```

Notes
* Native addon is optional; fallback uses Node streams.
* Metrics are in-memory and demo-grade; wire to real telemetry in production.
* Add real encryption/compression or transport adapters as needed; current implementations are illustrative.

