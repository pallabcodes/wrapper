# Migration Guide: Advanced DDD → Microservice Architecture

This guide shows how to evolve from **Advanced DDD + CQRS** to **Microservice Architecture** when your organization requires distributed systems.

## 📊 When to Migrate

**Migrate when you experience:**

- ❌ **Team Scaling**: Multiple teams (10+) working on same codebase
- ❌ **Deployment Conflicts**: Teams blocked by each other's deployments
- ❌ **Technology Lock-in**: Teams want different tech stacks
- ❌ **Performance Bottlenecks**: Monolith can't scale different parts independently
- ❌ **Regulatory Requirements**: Data sovereignty and compliance needs
- ❌ **Geographic Distribution**: Global users requiring regional deployments

**Don't migrate if:**
- ✅ Team size remains small (< 20 developers)
- ✅ Single deployment pipeline works
- ✅ Technology consistency is prioritized
- ✅ Strong coupling between business domains
- ✅ Resources don't support infrastructure complexity

## 🏗️ Microservice Migration Strategy

### Phase 1: Domain Analysis & Bounded Contexts

#### Step 1.1: Identify Bounded Contexts
```typescript
// Analyze your domain to find natural service boundaries
// Use Event Storming or Domain Storytelling

// Current Advanced DDD domain
export class UserAggregate { /* User management */ }
export class AuthenticationAggregate { /* Auth logic */ }
export class NotificationAggregate { /* Email/SMS */ }

// Identify bounded contexts
// 1. User Management Context
// 2. Authentication Context
// 3. Notification Context
// 4. Analytics Context (future)
```

#### Step 1.2: Define Service Boundaries
```typescript
// user-service bounded context
export class User {
  // User-specific business logic
  changeProfile() {}
  updatePreferences() {}
}

// auth-service bounded context
export class Authentication {
  // Auth-specific business logic
  login() {}
  refreshToken() {}
  validatePermissions() {}
}

// notification-service bounded context
export class Notification {
  // Notification-specific business logic
  sendEmail() {}
  sendSMS() {}
  scheduleNotification() {}
}
```

#### Step 1.3: Define Service Interfaces
```typescript
// user-service API contract
export interface UserServiceAPI {
  createUser(command: CreateUserCommand): Promise<string>;
  getUser(query: GetUserQuery): Promise<UserDto>;
  updateUser(command: UpdateUserCommand): Promise<void>;
}

// Events published by user-service
export class UserCreatedEvent {
  constructor(public readonly userId: string, public readonly email: string) {}
}

export class UserProfileUpdatedEvent {
  constructor(public readonly userId: string, public readonly changes: ProfileChanges) {}
}
```

---

### Phase 2: Extract First Service

#### Step 2.1: Create Service Structure
```bash
# Create user-service directory structure
mkdir -p services/user-service/
cd services/user-service/

# Service structure (similar to advanced level but service-scoped)
├── src/
│   ├── domain/           # User bounded context
│   ├── application/      # CQRS handlers
│   ├── infrastructure/   # Adapters
│   └── presentation/     # REST API
├── test/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── k8s/                 # Kubernetes manifests
```

#### Step 2.2: Extract User Domain
```typescript
// services/user-service/src/domain/user.aggregate.ts
export class UserAggregate extends AggregateRoot {
  private _email: Email;
  private _name: string;
  private _profile: UserProfile;

  constructor(id: string) {
    super(id);
  }

  static create(id: string, email: Email, name: string): UserAggregate {
    const user = new UserAggregate(id);
    user.addDomainEvent(new UserCreatedEvent(id, email.value, name));
    return user;
  }

  updateProfile(profile: UserProfile): void {
    // Domain logic
    this.validateProfile(profile);
    this._profile = profile;
    this.addDomainEvent(new UserProfileUpdatedEvent(this.id, profile));
  }
}
```

#### Step 2.3: Extract CQRS Handlers
```typescript
// services/user-service/src/application/commands/create-user.handler.ts
@Injectable()
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<string> {
    const userId = UserId.generate();
    const email = Email.create(command.email);

    // Check if user exists (service-level validation)
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsException(command.email);
    }

    const user = UserAggregate.create(userId, email, command.name);
    await this.userRepository.save(user);

    // Publish events for other services
    await this.eventBus.publishFromAggregate(user);

    return userId;
  }
}
```

#### Step 2.4: Create Service API
```typescript
// services/user-service/src/presentation/controllers/user.controller.ts
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createUser(@Body() command: CreateUserCommand) {
    const userId = await this.commandBus.execute(command);
    return { userId };
  }

  @Get(':id')
  async getUser(@Param('id') userId: string) {
    const query = new GetUserQuery(userId);
    return this.queryBus.execute(query);
  }
}
```

#### Step 2.5: Database per Service
```typescript
// services/user-service/src/infrastructure/config/database.config.ts
export const databaseConfig = {
  type: 'postgres',
  host: process.env.DB_HOST || 'user-db',
  port: 5432,
  database: 'user_service',
  entities: ['src/**/*.entity.ts'],
  synchronize: false, // Use migrations
};
```

---

### Phase 3: Implement Service Communication

#### Step 3.1: Event-Driven Communication
```typescript
// services/user-service/src/infrastructure/messaging/event-bus.adapter.ts
@Injectable()
export class RabbitMQEventBus implements IEventBus {
  constructor(private readonly amqpConnection: Connection) {}

  async publish(event: DomainEvent): Promise<void> {
    const exchange = 'user-service-events';
    const routingKey = event.constructor.name;

    await this.amqpConnection.publish(exchange, routingKey, Buffer.from(JSON.stringify(event)));
  }
}

// services/auth-service/src/application/events/user-created.handler.ts
@Injectable()
export class UserCreatedEventHandler {
  constructor(private readonly authRepository: IAuthRepository) {}

  @EventHandler(UserCreatedEvent)
  async handle(event: UserCreatedEvent): Promise<void> {
    // Create auth profile when user is created
    await this.authRepository.createAuthProfile(event.userId, {
      email: event.email,
      roles: ['USER'],
      isEmailVerified: false,
    });
  }
}
```

#### Step 3.2: Synchronous Communication (When Needed)
```typescript
// services/api-gateway/src/clients/user-service.client.ts
@Injectable()
export class UserServiceClient {
  constructor(private readonly httpService: HttpService) {}

  async getUser(userId: string): Promise<UserDto> {
    try {
      const response = await this.httpService.get(
        `${process.env.USER_SERVICE_URL}/users/${userId}`
      );
      return response.data;
    } catch (error) {
      // Circuit breaker pattern
      throw new ServiceUnavailableException('User service unavailable');
    }
  }
}
```

#### Step 3.3: Saga Pattern for Distributed Transactions
```typescript
// services/user-service/src/application/sagas/user-registration.saga.ts
@Injectable()
export class UserRegistrationSaga {
  constructor(
    private readonly userService: UserService,
    private readonly authServiceClient: AuthServiceClient,
    private readonly notificationServiceClient: NotificationServiceClient,
    private readonly sagaRepository: ISagaRepository,
  ) {}

  async execute(command: RegisterUserCommand): Promise<void> {
    const sagaId = SagaId.generate();

    try {
      // Step 1: Create user (local transaction)
      const userId = await this.userService.createUser(command);

      // Step 2: Create auth profile (remote call)
      await this.authServiceClient.createAuthProfile(userId, command.email);

      // Step 3: Schedule welcome email (remote call)
      await this.notificationServiceClient.scheduleWelcomeEmail(userId);

      // Mark saga as completed
      await this.sagaRepository.markCompleted(sagaId);

    } catch (error) {
      // Compensating actions
      await this.rollbackSaga(sagaId, userId);
      throw error;
    }
  }

  private async rollbackSaga(sagaId: string, userId?: string): Promise<void> {
    if (userId) {
      await this.userService.deleteUser(userId);
      await this.authServiceClient.deleteAuthProfile(userId);
    }
    await this.sagaRepository.markFailed(sagaId);
  }
}
```

---

### Phase 4: Infrastructure & Deployment

#### Step 4.1: Service Mesh Configuration
```yaml
# k8s/service-mesh.yaml
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
  - match:
    - uri:
        prefix: "/internal"
    route:
    - destination:
        host: user-service
    # Internal communication bypasses gateway
```

#### Step 4.2: API Gateway Configuration
```typescript
// services/api-gateway/src/routes.ts
export const routes = [
  {
    path: '/api/users',
    service: 'user-service',
    methods: ['GET', 'POST', 'PUT'],
    auth: 'required',
    rateLimit: '1000/minute',
  },
  {
    path: '/api/auth',
    service: 'auth-service',
    methods: ['POST'],
    auth: 'none',
    rateLimit: '100/minute',
  },
  {
    path: '/api/notifications',
    service: 'notification-service',
    methods: ['GET', 'POST'],
    auth: 'required',
    rateLimit: '500/minute',
  },
];
```

#### Step 4.3: Centralized Configuration
```typescript
// services/config-server/src/config/user-service.config.ts
export const userServiceConfig = {
  database: {
    host: process.env.DB_HOST,
    database: 'user_service',
  },
  messaging: {
    rabbitmq: {
      url: process.env.RABBITMQ_URL,
      exchanges: ['user-service-events'],
    },
  },
  features: {
    emailVerification: true,
    profilePictures: false,
  },
};
```

#### Step 4.4: Service Discovery
```typescript
// services/user-service/src/infrastructure/discovery/service-discovery.ts
@Injectable()
export class EurekaServiceDiscovery implements IServiceDiscovery {
  constructor(private readonly eurekaClient: EurekaClient) {}

  async discoverService(serviceName: string): Promise<string> {
    const instances = this.eurekaClient.getInstancesByAppId(serviceName.toUpperCase());
    if (instances.length === 0) {
      throw new ServiceNotFoundException(serviceName);
    }

    // Load balancing
    return instances[Math.floor(Math.random() * instances.length)].homePageUrl;
  }
}
```

---

### Phase 5: Observability & Monitoring

#### Step 5.1: Distributed Tracing
```typescript
// services/user-service/src/infrastructure/monitoring/tracing.interceptor.ts
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const span = tracer.startSpan('http_request', {
      attributes: {
        'http.method': request.method,
        'http.url': request.url,
        'service.name': 'user-service',
        'correlation.id': request.headers['x-correlation-id'],
      },
    });

    // Propagate correlation ID
    request.correlationId = span.spanContext().traceId;

    return next.handle().pipe(
      tap(() => {
        span.setAttribute('http.status_code', 200);
        span.end();
      }),
      catchError((error) => {
        span.recordException(error);
        span.setAttribute('http.status_code', error.status || 500);
        span.end();
        throw error;
      }),
    );
  }
}
```

#### Step 5.2: Centralized Logging
```typescript
// services/user-service/src/infrastructure/logging/logger.service.ts
@Injectable()
export class LoggerService {
  constructor(private readonly logger: WinstonLogger) {}

  info(message: string, context?: any): void {
    this.logger.info(message, {
      service: 'user-service',
      correlationId: context?.correlationId,
      userId: context?.userId,
      ...context,
    });
  }

  error(message: string, error: Error, context?: any): void {
    this.logger.error(message, {
      service: 'user-service',
      correlationId: context?.correlationId,
      stack: error.stack,
      ...context,
    });
  }
}
```

#### Step 5.3: Metrics & Health Checks
```typescript
// services/user-service/src/infrastructure/monitoring/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly databaseHealth: DatabaseHealthIndicator,
    private readonly messageQueueHealth: MessageQueueHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return HealthCheckService
      .getBuilder()
      .addCheck('database', () => this.databaseHealth.isHealthy('user-db'))
      .addCheck('message-queue', () => this.messageQueueHealth.isHealthy('rabbitmq'))
      .build()
      .check();
  }
}
```

---

### Phase 6: Testing & Quality Assurance

#### Step 6.1: Contract Testing
```typescript
// services/user-service/test/contracts/user-service.contract.ts
describe('User Service Contracts', () => {
  it('should create user and publish UserCreated event', async () => {
    // Arrange
    const command = new CreateUserCommand('test@example.com', 'Test User');

    // Act
    const userId = await commandBus.execute(command);

    // Assert
    expect(userId).toBeDefined();

    // Verify event published
    const publishedEvents = eventBus.getPublishedEvents();
    expect(publishedEvents).toContainEqual(
      new UserCreatedEvent(userId, 'test@example.com', 'Test User')
    );
  });
});
```

#### Step 6.2: Integration Testing
```typescript
// test/integration/user-registration.integration.spec.ts
describe('User Registration Integration', () => {
  it('should create user across services', async () => {
    // Start all services in test containers
    const testEnvironment = await TestEnvironment.start([
      'user-service',
      'auth-service',
      'notification-service',
    ]);

    // Execute registration
    const response = await testEnvironment.apiGateway
      .post('/register')
      .send({
        email: 'integration@example.com',
        password: 'TestPass123!',
        name: 'Integration Test',
      });

    expect(response.status).toBe(201);

    // Verify user created in user service
    const userService = testEnvironment.getService('user-service');
    const user = await userService.database.query(
      'SELECT * FROM users WHERE email = ?',
      ['integration@example.com']
    );
    expect(user).toBeDefined();

    // Verify auth profile created in auth service
    const authService = testEnvironment.getService('auth-service');
    const authProfile = await authService.database.query(
      'SELECT * FROM auth_profiles WHERE user_id = ?',
      [user.id]
    );
    expect(authProfile).toBeDefined();

    // Verify welcome email scheduled
    const notificationService = testEnvironment.getService('notification-service');
    const email = await notificationService.messageQueue.getMessage('welcome-emails');
    expect(email.to).toBe('integration@example.com');
  });
});
```

---

## 📈 Benefits After Migration

### **Team Autonomy**
- ✅ **Independent Deployment**: Teams deploy when ready
- ✅ **Technology Choice**: Teams choose best tools for their domain
- ✅ **Ownership**: Teams own complete service lifecycle
- ✅ **Scaling**: Teams scale independently

### **System Resilience**
- ✅ **Fault Isolation**: Service failures don't cascade
- ✅ **Graceful Degradation**: Partial system failures handled
- ✅ **Circuit Breakers**: Prevent cascading failures
- ✅ **Load Balancing**: Traffic distributed automatically

### **Performance & Scalability**
- ✅ **Independent Scaling**: Scale services based on specific needs
- ✅ **Resource Optimization**: Allocate resources efficiently
- ✅ **Geographic Distribution**: Deploy services closer to users
- ✅ **Caching Strategies**: Service-specific caching optimizations

### **Business Agility**
- ✅ **Innovation**: Try new technologies in isolated services
- ✅ **A/B Testing**: Test features on specific user segments
- ✅ **Regulatory Compliance**: Data sovereignty per service
- ✅ **Market Speed**: Faster feature delivery for specific domains

---

## 🚨 Migration Challenges & Solutions

### **1. Distributed Transactions**
**Challenge**: Maintaining consistency across services
**Solution**:
- Saga pattern for long-running transactions
- Eventual consistency with compensation actions
- Idempotent operations to handle retries

### **2. Service Communication**
**Challenge**: Network latency, serialization, failures
**Solution**:
- Async communication with events (preferred)
- Circuit breakers and retries for sync calls
- API versioning and contract testing

### **3. Data Consistency**
**Challenge**: Eventual consistency vs immediate consistency needs
**Solution**:
- CQRS for complex consistency requirements
- Read models for immediate consistency needs
- Eventual consistency with user-friendly messaging

### **4. Operational Complexity**
**Challenge**: Multiple services, databases, deployments
**Solution**:
- Infrastructure as Code (Terraform, Kubernetes)
- Automated testing and deployment pipelines
- Centralized monitoring and alerting

### **5. Team Coordination**
**Challenge**: Coordinating changes across services
**Solution**:
- API contracts and schema registries
- Consumer-driven contract testing
- Event versioning and compatibility guarantees

### **6. Debugging Complexity**
**Challenge**: Tracing issues across service boundaries
**Solution**:
- Distributed tracing (Jaeger, Zipkin)
- Correlation IDs for request tracking
- Centralized logging with search capabilities

---

## 📊 Success Metrics

### **Technical Metrics**
- **Service Independence**: >95% of changes don't require coordination
- **Deployment Frequency**: Daily deployments per service
- **MTTR (Mean Time To Recovery)**: < 15 minutes for service failures
- **Cross-Service Latency**: < 100ms for sync calls, < 5s for async

### **Business Metrics**
- **Development Velocity**: 2x faster feature delivery
- **Team Productivity**: Reduced cross-team dependencies
- **Innovation Rate**: 3x more technology experiments
- **Customer Impact**: Improved reliability and performance

### **Operational Metrics**
- **Service Uptime**: >99.9% per service
- **Auto-Recovery**: >90% of failures auto-resolved
- **Monitoring Coverage**: 100% of services monitored
- **Incident Response**: < 5 minutes mean detection time

---

## 🔄 Rollback Strategy

If microservice migration fails, rollback steps:

1. **Consolidate Services**: Merge related services back together
2. **Remove Async Communication**: Convert events back to direct calls
3. **Centralize Data**: Move to shared database
4. **Simplify Deployment**: Single deployment pipeline
5. **Remove Infrastructure**: Simplify to monolith deployment

**Keep**: Domain modeling, CQRS patterns, clean architecture principles

---

## 📚 Next Steps

After successful microservice migration:

1. **Service Mesh Adoption**: Implement Istio/Linkerd for advanced traffic management
2. **Event Streaming**: Consider Kafka for event streaming at scale
3. **Multi-Region Deployment**: Global distribution with regional services
4. **Machine Learning Integration**: AI services as microservices
5. **Platform Evolution**: Serverless, edge computing integration

---

**Remember**: Microservices enable organizational scaling. Use them when your organization needs independent service evolution, not just technical scalability! 🏗️🚀

**Final Evolution**: Simple → Clean → Advanced → Microservice = Complete Architectural Maturity! 🎯