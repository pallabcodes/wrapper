# Infrastructure Layer

## What is this?

The **Infrastructure Layer** contains **adapters** that connect your application to the external world: databases, APIs, file systems, message queues, etc.

Think of it as: "How do I store data?" "How do I send emails?" "How do I call external APIs?"

---

## Folder Structure

```
infrastructure/
├── persistence/     ← Database adapters (Sequelize, TypeORM implementations)
├── http/            ← HTTP clients (API calls to external services)
├── messaging/       ← Queue adapters (BullMQ, RabbitMQ)
├── file-system/     ← File storage adapters (local, S3, Azure Blob)
└── external/        ← Third-party service adapters (Stripe, SendGrid, etc.)
```

---

## Persistence (Database)

**What:** Implements repository ports using a specific database technology.

**Example:**
```typescript
// infrastructure/persistence/user.repository.ts
@Injectable()
export class SequelizeUserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserModel) private userModel: typeof UserModel,
  ) {}

  async save(user: User): Promise<User> {
    // Convert domain entity to database model
    const model = UserMapper.toModel(user);
    const saved = await this.userModel.create(model);
    // Convert database model back to domain entity
    return UserMapper.toEntity(saved);
  }
}
```

**Rules:**
- ✅ Implements ports from domain/application layer
- ✅ Handles database-specific code (Sequelize, TypeORM)
- ✅ Converts between Domain Entity ↔ Database Model
- ✅ Uses mappers for conversion

---

## HTTP Clients

**What:** Makes HTTP calls to external APIs.

**Example:**
```typescript
// infrastructure/http/stripe.client.ts
@Injectable()
export class StripeClient implements IPaymentService {
  constructor(private httpService: HttpService) {}

  async processPayment(amount: number, token: string): Promise<PaymentResult> {
    const response = await this.httpService.post('/charges', {
      amount,
      token,
    });
    return this.mapToDomain(response.data);
  }
}
```

**Rules:**
- ✅ Implements ports from domain/application
- ✅ Handles HTTP-specific details (headers, errors, retries)
- ✅ Converts external API responses to domain types

---

## Messaging (Queues)

**What:** Publishes/subscribes to message queues.

**Example:**
```typescript
// infrastructure/messaging/email.queue.ts
@Injectable()
export class BullEmailQueue implements IEmailQueue {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async sendEmail(email: EmailMessage): Promise<void> {
    await this.emailQueue.add('send', email);
  }
}
```

**Rules:**
- ✅ Implements queue ports
- ✅ Handles queue-specific code (BullMQ, RabbitMQ)
- ✅ Converts domain types to queue messages

---

## File System

**What:** Handles file storage (local, cloud storage).

**Example:**
```typescript
// infrastructure/file-system/local-storage.ts
@Injectable()
export class LocalFileStorage implements IFileStorage {
  async save(file: File, path: string): Promise<string> {
    await fs.writeFile(path, file.buffer);
    return path;
  }
}
```

**Rules:**
- ✅ Implements file storage ports
- ✅ Handles storage-specific code (local, S3, Azure)
- ✅ Abstracts storage details from application

---

## External Services

**What:** Integrations with third-party services.

**Example:**
```typescript
// infrastructure/external/sendgrid.service.ts
@Injectable()
export class SendGridEmailService implements IEmailService {
  constructor(private sendGridClient: SendGridClient) {}

  async send(email: Email): Promise<void> {
    await this.sendGridClient.send({
      to: email.to,
      subject: email.subject,
      body: email.body,
    });
  }
}
```

**Rules:**
- ✅ Implements service ports
- ✅ Handles third-party SDKs
- ✅ Converts domain types to external API formats

---

## Key Principles

1. **Implements Ports** - All adapters implement interfaces from domain/application
2. **Framework Code Here** - Sequelize, HTTP clients, file system - all here
3. **Conversion** - Convert between Domain ↔ Infrastructure representations
4. **Swappable** - Can swap implementations without changing business logic

---

## Example: Swapping Implementations

```typescript
// Easy to swap database implementations:

// Option 1: Sequelize
@Module({
  providers: [
    { provide: IUserRepository, useClass: SequelizeUserRepository },
  ],
})

// Option 2: TypeORM
@Module({
  providers: [
    { provide: IUserRepository, useClass: TypeOrmUserRepository },
  ],
})

// Option 3: MongoDB
@Module({
  providers: [
    { provide: IUserRepository, useClass: MongoUserRepository },
  ],
})
```

**Business logic doesn't change!** Only the infrastructure adapter changes.

---

## What NOT to Put Here

❌ Business logic (that's domain)  
❌ Use case orchestration (that's application)  
❌ HTTP controllers (that's presentation)  
❌ Domain entities (that's domain)

