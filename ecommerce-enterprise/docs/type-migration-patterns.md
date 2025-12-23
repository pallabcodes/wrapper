# Type Migration Patterns

This document provides patterns and examples for migrating from `any` types to proper TypeScript types.

## Common Patterns

### 1. Guard and Interceptor Signatures

**Before:**
```typescript
override handleRequest(err: any, user: any, info: any, context: ExecutionContext, _status?: any): any {
  // ...
}
```

**After:**
```typescript
import type { Request } from 'express';
import type { AuthPrincipal } from '../types/auth.types';

interface GuardRequest extends Request {
  user?: AuthPrincipal;
  authContext?: AuthContext<AuthPrincipal>;
}

override handleRequest(
  err: Error | null,
  user: AuthPrincipal | false,
  info: Error | undefined,
  context: ExecutionContext,
  _status?: number
): AuthPrincipal {
  if (err || !user) {
    throw err || info || new Error('Unauthorized');
  }
  return user;
}
```

### 2. Service Method Parameters

**Before:**
```typescript
async processPayment(data: any): Promise<any> {
  // ...
}
```

**After:**
```typescript
import type { CreatePaymentDto } from '../dto/create-payment.dto';
import type { PaymentResponseDto } from '../dto/payment-response.dto';

async processPayment(data: CreatePaymentDto): Promise<PaymentResponseDto> {
  // ...
}
```

### 3. Controller Handlers

**Before:**
```typescript
@Post()
async create(@Body() body: any, @Req() req: any): Promise<any> {
  // ...
}
```

**After:**
```typescript
import type { Request } from 'express';
import type { CreatePaymentDto } from '../dto/create-payment.dto';
import type { PaymentResponseDto } from '../dto/payment-response.dto';

interface AuthenticatedRequest extends Request {
  user: AuthPrincipal;
}

@Post()
async create(
  @Body() body: CreatePaymentDto,
  @Req() req: AuthenticatedRequest
): Promise<PaymentResponseDto> {
  // ...
}
```

### 4. Database/ORM Types

**Before:**
```typescript
async findById(id: any): Promise<any> {
  return this.repository.findOne({ where: { id } });
}
```

**After:**
```typescript
async findById(id: string): Promise<Payment | null> {
  return this.repository.findOne({ where: { id } });
}
```

### 5. External Library Integrations

**Before:**
```typescript
async createStripeCustomer(data: any): Promise<any> {
  return this.stripe.customers.create(data);
}
```

**After:**
```typescript
import type Stripe from 'stripe';

async createStripeCustomer(
  data: Stripe.CustomerCreateParams
): Promise<Stripe.Customer> {
  return this.stripe.customers.create(data);
}
```

### 6. Event Handlers

**Before:**
```typescript
@OnEvent('payment.completed')
async handlePaymentCompleted(payload: any): Promise<void> {
  // ...
}
```

**After:**
```typescript
interface PaymentCompletedEvent {
  paymentId: string;
  amount: number;
  currency: string;
  userId: string;
  timestamp: Date;
}

@OnEvent('payment.completed')
async handlePaymentCompleted(payload: PaymentCompletedEvent): Promise<void> {
  // ...
}
```

### 7. Generic Service Responses

**Before:**
```typescript
async getData(): Promise<any> {
  // ...
}
```

**After:**
```typescript
interface ServiceResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

async getData(): Promise<ServiceResponse<Payment[]>> {
  // ...
}
```

### 8. Adapter-Agnostic Request/Response

**Before:**
```typescript
use(req: any, res: any, next: () => void) {
  // ...
}
```

**After:**
```typescript
interface AdapterRequest {
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

interface AdapterResponse {
  status(code: number): this;
  json(body: unknown): this;
  send(body: unknown): this;
  end(chunk?: unknown): this;
  [key: string]: unknown;
}

use(req: AdapterRequest, res: AdapterResponse, next: () => void) {
  // ...
}
```

## Utility Types

### Request Context Type

```typescript
// packages/types/src/request-context.ts
export interface RequestContext {
  requestId: string;
  userId?: string;
  tenantId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthenticatedRequestContext extends RequestContext {
  userId: string;
  principal: AuthPrincipal;
}
```

### Service Response Type

```typescript
// packages/types/src/service-response.ts
export interface ServiceResponse<T> {
  data: T;
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ServiceResult<T> = ServiceResponse<T> | Error;
```

### Event Payload Type

```typescript
// packages/types/src/events.ts
export interface BaseEvent<T = unknown> {
  eventId: string;
  eventType: string;
  timestamp: Date;
  payload: T;
  metadata?: Record<string, unknown>;
}

export type PaymentEvent = BaseEvent<{
  paymentId: string;
  amount: number;
  currency: string;
}>;
```

## Migration Checklist

When migrating a file:

1. [ ] Identify all `any` types in the file
2. [ ] Determine the proper type for each `any`
3. [ ] Create type definitions if they don't exist
4. [ ] Replace `any` with proper types
5. [ ] Update function signatures
6. [ ] Update variable declarations
7. [ ] Add type imports
8. [ ] Run TypeScript compiler to verify
9. [ ] Run tests to ensure no breaking changes
10. [ ] Update related files if needed

## Common Pitfalls

### Pitfall 1: Overly Broad Types
**Avoid:**
```typescript
function process(data: Record<string, unknown>): unknown {
  // ...
}
```

**Prefer:**
```typescript
interface ProcessData {
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
}

function process(data: ProcessData): ProcessResult {
  // ...
}
```

### Pitfall 2: Using `unknown` Without Narrowing
**Avoid:**
```typescript
function handle(data: unknown) {
  return data.someProperty; // Error: Property doesn't exist on unknown
}
```

**Prefer:**
```typescript
function handle(data: unknown) {
  if (typeof data === 'object' && data !== null && 'someProperty' in data) {
    return (data as { someProperty: string }).someProperty;
  }
  throw new Error('Invalid data');
}
```

### Pitfall 3: Ignoring Library Types
**Avoid:**
```typescript
import Stripe from 'stripe';

function createCustomer(data: { email: string; name: string }) {
  return stripe.customers.create(data); // May not match Stripe types
}
```

**Prefer:**
```typescript
import type Stripe from 'stripe';

function createCustomer(data: Stripe.CustomerCreateParams) {
  return stripe.customers.create(data); // Type-safe
}
```

## Resources

- [TypeScript Handbook: Types](https://www.typescriptlang.org/docs/handbook/2/types.html)
- [TypeScript Handbook: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript Deep Dive: Type Guards](https://basarat.gitbook.io/typescript/type-system/typeguard)
