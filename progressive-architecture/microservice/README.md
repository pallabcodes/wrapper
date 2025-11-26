# Microservice Architecture: Hexagonal + Distributed Systems

**Level 4**: Enterprise microservices with Hexagonal Architecture, event-driven communication, and distributed system patterns.

## 🎯 Purpose

This level demonstrates **enterprise-scale distributed systems** for:
- Large organizations (100+ developers across multiple teams)
- Complex business ecosystems with independent services
- High scalability and availability requirements
- Independent deployment and technology choices
- Regulatory compliance and data sovereignty

## 🏗️ Architecture Overview

```
Microservice Ecosystem
├── user-service/           # User management bounded context
│   ├── domain/            # Business logic (Hexagonal)
│   ├── application/       # Use cases & CQRS
│   ├── infrastructure/    # Adapters & external services
│   ├── presentation/      # API gateways & interfaces
│   └── deployment/        # Kubernetes manifests
├── auth-service/          # Authentication bounded context
├── notification-service/  # Email/SMS notifications
├── api-gateway/           # Request routing & composition
├── event-bus/             # Async communication backbone
├── service-mesh/          # Observability & traffic management
└── infrastructure/        # Shared infrastructure services
    ├── config-server/     # Centralized configuration
    ├── discovery-server/  # Service registration/discovery
    ├── monitoring/        # Centralized logging/metrics
    └── database/          # Per-service databases
```

## ✨ Enterprise Patterns Implemented

### 1. **Hexagonal Architecture (Ports & Adapters)**
```
Service Boundary (Hexagon)
├── Inside: Domain + Application Logic
│   ├── Domain: Business rules, entities, invariants
│   ├── Application: Use cases, commands, queries
│   └── Ports: Interfaces for external communication
└── Outside: Infrastructure Adapters
    ├── Primary Adapters: REST, GraphQL, CLI
    ├── Secondary Adapters: Database, Message Queue, External APIs
    └── Driven by Ports (Dependency Inversion)
```

### 2. **Bounded Contexts & Domain-Driven Design**
```typescript
// Each microservice owns its bounded context
// user-service bounded context
export class User { /* User domain model */ }
export class Profile { /* Profile domain model */ }

// auth-service bounded context
export class Authentication { /* Auth domain model */ }
export class Authorization { /* Permission domain model */ }

// Independent evolution, different models for same concepts
```

### 3. **Event-Driven Communication**
```typescript
// Async event-driven architecture
// Services communicate via events, not direct calls

// User Service publishes events
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly timestamp: Date,
  ) {}
}

// Auth Service reacts to events
@Injectable()
export class UserRegisteredEventHandler {
  async handle(event: UserRegisteredEvent): Promise<void> {
    // Create auth profile for new user
    await this.authService.createAuthProfile(event.userId, event.email);
  }
}

// Notification Service reacts to events
@Injectable()
export class SendWelcomeEmailHandler {
  async handle(event: UserRegisteredEvent): Promise<void> {
    // Send welcome email asynchronously
    await this.emailService.sendWelcomeEmail(event.email);
  }
}
```

### 4. **Saga Pattern (Distributed Transactions)**
```typescript
// Handle distributed transactions across services
@Injectable()
export class UserRegistrationSaga {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(userData: RegisterUserCommand): Promise<void> {
    const sagaId = SagaId.generate();

    try {
      // Step 1: Create user
      const userId = await this.userService.createUser(userData);

      // Step 2: Create auth profile
      await this.authService.createAuthProfile(userId, userData.email);

      // Step 3: Send welcome notification
      await this.notificationService.scheduleWelcomeEmail(userId);

      // Mark saga as completed
      await this.sagaRepository.markCompleted(sagaId);

    } catch (error) {
      // Compensating actions for rollback
      await this.rollbackSaga(sagaId, userId);
      throw error;
    }
  }

  private async rollbackSaga(sagaId: string, userId?: string): Promise<void> {
    if (userId) {
      await this.userService.deleteUser(userId);
      await this.authService.deleteAuthProfile(userId);
    }
    await this.sagaRepository.markFailed(sagaId);
  }
}
```

### 5. **CQRS with Event Sourcing**
```typescript
// Event Sourcing: Complete audit trail
@Injectable()
export class EventSourcedUserRepository implements IUserRepository {
  constructor(private readonly eventStore: EventStore) {}

  async save(aggregate: UserAggregate): Promise<void> {
    const events = aggregate.domainEvents;
    const streamName = `user-${aggregate.id}`;

    // Append events to event stream
    await this.eventStore.appendToStream(streamName, events);

    // Publish events for other services to consume
    for (const event of events) {
      await this.eventBus.publish(event);
    }
  }

  async findById(id: string): Promise<UserAggregate | null> {
    const streamName = `user-${id}`;
    const events = await this.eventStore.readStream(streamName);

    if (events.length === 0) return null;

    // Reconstruct aggregate from event history
    return UserAggregate.reconstruct(id, events);
  }
}

// Read models optimized per service needs
@Injectable()
export class UserReadModelProjection {
  constructor(
    @Inject('USER_READ_DB')
    private readonly readDb: DatabaseConnection,
  ) {}

  async project(event: DomainEvent): Promise<void> {
    // Update multiple read models for different use cases
    await Promise.all([
      this.updateUserListView(event),
      this.updateUserProfileView(event),
      this.updateUserSearchIndex(event),
    ]);
  }
}
```

## 🔄 Service Communication Patterns

### **Synchronous Communication**
```typescript
// API Gateway → Service communication
@Injectable()
export class ApiGatewayController {
  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly authServiceClient: AuthServiceClient,
  ) {}

  @Get('user-profile')
  async getUserProfile(@CurrentUser() user: AuthenticatedUser) {
    // Parallel service calls
    const [userData, authData] = await Promise.all([
      this.userServiceClient.getUser(user.id),
      this.authServiceClient.getAuthProfile(user.id),
    ]);

    // Compose response
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      roles: authData.roles,
      permissions: authData.permissions,
    };
  }
}
```

### **Asynchronous Communication**
```typescript
// Event-driven service integration
@Injectable()
export class OrderPlacedEventHandler {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly notificationService: NotificationService,
  ) {}

  @EventHandler(OrderPlacedEvent)
  async handle(event: OrderPlacedEvent): Promise<void> {
    // Update inventory (eventual consistency)
    await this.inventoryService.reserveItems(event.orderId, event.items);

    // Send notification (fire and forget)
    await this.notificationService.sendOrderConfirmation(event.customerEmail);
  }
}
```

## 🏢 Infrastructure & Deployment

### **Service Mesh (Istio/Linkerd)**
```yaml
# Service mesh configuration
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  http:
  - match:
    - uri:
        prefix: "/api/users"
    route:
    - destination:
        host: user-service
    timeout: 30s
    retries:
      attempts: 3
      perTryTimeout: 10s
```

### **API Gateway (Kong/Ambassador)**
```typescript
// API Gateway routing rules
const routes = [
  {
    path: '/api/users',
    service: 'user-service',
    methods: ['GET', 'POST'],
    auth: 'required',
  },
  {
    path: '/api/auth',
    service: 'auth-service',
    methods: ['POST'],
    auth: 'none',
  },
  {
    path: '/api/notifications',
    service: 'notification-service',
    methods: ['GET', 'POST'],
    auth: 'required',
  },
];
```

### **Distributed Tracing**
```typescript
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const span = tracer.startSpan('http_request', {
      attributes: {
        'http.method': request.method,
        'http.url': request.url,
        'service.name': 'user-service',
      },
    });

    // Add correlation ID for distributed tracing
    request.correlationId = span.spanContext().traceId;

    return next.handle().pipe(
      tap(() => span.end()),
      catchError((error) => {
        span.recordException(error);
        span.end();
        throw error;
      }),
    );
  }
}
```

## 🎯 When to Use Microservice Architecture

### ✅ **Good Fit**
- **Large Teams**: 50+ developers across multiple teams
- **Independent Deployment**: Teams deploy independently
- **Technology Diversity**: Different services use different tech stacks
- **Scalability**: Services have vastly different scaling needs
- **Regulatory**: Data sovereignty and compliance requirements
- **Geographic Distribution**: Global user base with regional requirements

### ❌ **Not a Good Fit**
- **Small Teams**: < 20 developers total
- **Simple Domain**: CRUD operations with minimal business logic
- **Tight Coupling**: Services need to share data frequently
- **Transactional Needs**: Strong consistency requirements across services
- **Limited Resources**: Can't afford infrastructure complexity

### **Anti-Patterns to Avoid**
- **Microservice Mania**: Breaking monoliths into microservices unnecessarily
- **Distributed Monolith**: Tight coupling between services
- **Service Sprawl**: Too many tiny services
- **Data Duplication**: Inefficient data management across services

## 🚀 Quick Start

### **Local Development**
```bash
# Start infrastructure
docker-compose up -d kafka postgres redis

# Start services
npm run dev:user-service
npm run dev:auth-service
npm run dev:notification-service
npm run dev:api-gateway

# Run integration tests
npm run test:integration
```

### **Kubernetes Deployment**
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Check service health
kubectl get pods
kubectl logs -f deployment/user-service
```

## 📚 Architecture Documentation

- **[ADR Documents](./docs/adr/)**: Architectural decision records
- **[Service Contracts](./docs/contracts/)**: API and event schemas
- **[Deployment Guide](./docs/deployment/)**: Kubernetes and infrastructure
- **[Migration Guide](../docs/migration/advanced-to-microservice.md)**: Evolution from Advanced DDD

## 🔄 Evolution from Advanced Architecture

### **Advanced → Microservice Migration**
1. **Identify Bounded Contexts**: Domain analysis to find service boundaries
2. **Extract Services**: Split monolith into independent services
3. **Implement Communication**: Events for async, APIs for sync
4. **Add Infrastructure**: Service mesh, API gateway, monitoring
5. **Database per Service**: Independent data storage
6. **Deployment Automation**: CI/CD pipelines per service

### **Key Changes**
```typescript
// Advanced (Monolith)
@Injectable()
export class CreateUserCommandHandler {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(command: CreateUserCommand) {
    const user = UserAggregate.create(command);
    await this.userRepo.save(user);
  }
}

// Microservice (Distributed)
@Injectable()
export class CreateUserCommandHandler {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly eventBus: IEventBus, // Cross-service communication
    private readonly sagaManager: ISagaManager, // Distributed transactions
  ) {}

  async execute(command: CreateUserCommand) {
    const sagaId = await this.sagaManager.start('UserRegistrationSaga');

    try {
      // Local operations
      const user = UserAggregate.create(command);
      await this.userRepo.save(user);

      // Cross-service events
      await this.eventBus.publish(new UserCreatedEvent(user.id));

      await this.sagaManager.complete(sagaId);
    } catch (error) {
      await this.sagaManager.fail(sagaId);
      throw error;
    }
  }
}
```

---

## 🎯 Enterprise Benefits

### **Scalability**
- **Independent Scaling**: Scale services based on their specific needs
- **Resource Optimization**: Allocate resources where needed
- **Geographic Distribution**: Deploy services closer to users

### **Team Productivity**
- **Independent Deployment**: Teams ship independently
- **Technology Choice**: Teams choose best tools for their domain
- **Focused Ownership**: Teams own complete service lifecycle

### **Reliability**
- **Fault Isolation**: Service failures don't cascade
- **Graceful Degradation**: Partial system failures handled
- **Circuit Breakers**: Prevent cascading failures

### **Innovation**
- **Experimentation**: Try new technologies in isolated services
- **A/B Testing**: Test features on specific user segments
- **Incremental Migration**: Gradually modernize legacy systems

---

## 🚨 Challenges & Solutions

### **1. Distributed Systems Complexity**
**Challenge**: Debugging, monitoring, and coordination complexity
**Solution**:
- Comprehensive observability (logs, metrics, traces)
- Service mesh for traffic management
- Correlation IDs for request tracking

### **2. Data Consistency**
**Challenge**: Eventual consistency vs transactional guarantees
**Solution**:
- Saga pattern for distributed transactions
- Eventual consistency with compensation
- CQRS for complex consistency requirements

### **3. Service Communication**
**Challenge**: Network failures, latency, serialization
**Solution**:
- Circuit breakers and retries
- Async communication with events
- API versioning and contract testing

### **4. Operational Complexity**
**Challenge**: Multiple services, databases, deployments
**Solution**:
- Infrastructure as Code
- Automated testing and deployment
- Centralized monitoring and alerting

---

**Philosophy**: Microservices enable organizational scaling through technical architecture. Use them when your organization needs independent service evolution! 🏗️🚀